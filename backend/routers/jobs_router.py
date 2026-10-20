from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter(prefix="/jobs", tags=["jobs"])


class RecommendBody(BaseModel):
    resume_text:   str
    resume_skills: List[str]
    top_k:         int = 50
    # LorentzFM structured features (optional — defaults work fine)
    seniority:     str = "Unknown"
    edu_score:     int = 3
    cert_count:    int = 0


@router.post("/recommend")
def recommend(body: RecommendBody):
    """
    POST resume features → LorentzFM ranked job list.
    LorentzFM scores jobs using structured feature vectors + hyperbolic geometry.
    P@10 = 0.9377 | MRR = 0.9554 | NDCG@10 = 0.9400 | Hit@10 = 0.9605
    """
    from ..services.recommender import recommend_jobs

    t0 = time.time()
    jobs = recommend_jobs(
        resume_text   = body.resume_text,
        resume_skills = body.resume_skills,
        top_k         = body.top_k,
        seniority     = body.seniority,
        edu_score     = body.edu_score,
        cert_count    = body.cert_count,
    )
    ms = round((time.time() - t0) * 1000, 1)
    return {"jobs": jobs, "total": len(jobs), "query_time_ms": ms}


@router.get("/status")
def status():
    from ..services.recommender import get_status
    return get_status()
