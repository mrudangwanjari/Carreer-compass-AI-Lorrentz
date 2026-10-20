"""
run.py
──────
Start the CareerCompass AI backend on port 5455.
Run from the LorrentzFM/ root:
    python -m backend.run
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=5455,
        reload=True,
        log_level="info",
    )
