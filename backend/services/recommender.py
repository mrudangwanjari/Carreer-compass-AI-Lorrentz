"""
recommender.py
──────────────
Thin shim — delegates all recommendation logic to lorentz_recommender.py.
The production pipeline now uses LorentzFM (P@10 = 0.9377) instead of SBERT.
"""
from .lorentz_recommender import load_all, recommend_jobs, get_status

__all__ = ["load_all", "recommend_jobs", "get_status"]
