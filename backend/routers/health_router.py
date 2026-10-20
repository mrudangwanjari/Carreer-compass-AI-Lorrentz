from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    from ..services.recommender import get_status
    st = get_status()
    return {
        "status":              "ok",
        "version":             "1.0.0",
        "engine":              "LorentzFM",
        "lorentzfm_loaded":    st.get("lorentzfm_loaded", False),
        "features_loaded":     st.get("features_loaded",  False),
        "jobs_indexed":        st.get("jobs_indexed",      0),
        "embed_dim":           st.get("embed_dim",         32),
        "checkpoint":          st.get("checkpoint",        ""),
        # Legacy alias so any frontend code checking sbert_loaded still works
        "sbert_loaded":        st.get("lorentzfm_loaded", False),
    }


@router.get("/")
def root():
    return {
        "message": "CareerCompass AI API",
        "engine":  "LorentzFM (P@10=0.9377, MRR=0.9554, NDCG@10=0.9400)",
        "docs":    "/docs",
    }
