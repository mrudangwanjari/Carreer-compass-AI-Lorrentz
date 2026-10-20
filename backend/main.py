"""
main.py
───────
CareerCompass AI — FastAPI Backend
Runs on port 5455 (within the approved port range 5453-5458).

Endpoints:
  GET  /health              — liveness probe + model status
  POST /auth/login          — JWT login
  POST /auth/register       — create account
  POST /auth/demo           — one-click demo sign-in
  POST /resume/parse        — upload PDF/DOCX → parsed profile
  POST /jobs/recommend      — SBERT + FAISS job ranking
  GET  /jobs/status         — model load status
  POST /courses/recommend   — skill-gap ranked courses

Docs: http://localhost:5455/docs
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers.auth_router   import router as auth_router
from backend.routers.resume_router import router as resume_router
from backend.routers.jobs_router   import router as jobs_router
from backend.routers.courses_router import router as courses_router
from backend.routers.health_router import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("careercompass.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy models once at startup."""
    logger.info("CareerCompass AI API starting…")
    from backend.services.recommender import load_all
    try:
        load_all()
    except Exception as e:
        logger.error("Model load error (non-fatal): %s", e)
    yield
    logger.info("API shutting down.")


app = FastAPI(
    title="CareerCompass AI API",
    description="Resume parsing, LorentzFM job recommendations, and career intelligence.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow the Vite dev server on port 5453 ────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5453",   # Vite dev
        "http://localhost:5454",   # Vite preview
        "http://localhost:4173",   # Vite legacy preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(auth_router,    prefix="/api")
app.include_router(resume_router,  prefix="/api")
app.include_router(jobs_router,    prefix="/api")
app.include_router(courses_router, prefix="/api")


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs."},
    )
