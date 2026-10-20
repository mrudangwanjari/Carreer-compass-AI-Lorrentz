"""
lorentz_recommender.py
──────────────────────
Job recommendation service powered by the trained LorentzFM model.

Replaces the SBERT + FAISS pipeline with the LorentzFM structured-feature
approach that achieved:
    P@10 = 0.9377  |  MRR = 0.9554  |  NDCG@10 = 0.9400  |  Hit@10 = 0.9605

Architecture recap (from lorentzfm_experiment/models/lorentz_fm.py):
  • Resume → 19-dim structured vector → 5 FeatureFieldEncoders → Lorentz space
  • Job    → 53-dim structured vector → 5 FeatureFieldEncoders → Lorentz space
  • Score  = Σ_{i,j} −⟨e_i^R, e_j^J⟩_L  (cross-field Lorentz inner products)

Feature vectors built at inference time from:
  • Resume: domain vector (15) + skill_count (1) + seniority (1) +
            edu_score (1) + cert_count (1)   = 19 dims
  • Job:    domain vector (15) + skill code vector (35) + exp_level (1) +
            has_salary (1) + domain_count (1) = 53 dims

Domain vectors are derived from skill keyword matching — no pre-built CSV needed.
"""
from __future__ import annotations
import json
import logging
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import torch

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT          = Path(__file__).resolve().parents[2]   # LorrentzFM/
EXPERIMENT    = ROOT / "lorentzfm_experiment"
CHECKPOINT    = EXPERIMENT / "results" / "lorentzfm_best_model.pt"
DATASET       = ROOT / "dataset" / "postings.csv"
JOB_SKILLS_PATH = ROOT / "dataset" / "jobs" / "job_skills.csv"
SKILLS_MAP_PATH = ROOT / "dataset" / "mappings" / "skills.csv"
SPLIT_MANIFEST  = ROOT / "BERT" / "bert_experiment" / "data" / "split_manifest.csv"
FAISS_MAP_PATH  = ROOT / "BERT" / "bert_experiment" / "data" / "faiss_id_map.json"

# Add experiment root so we can import the model
sys.path.insert(0, str(ROOT))

# ── Constants (must match dataset.py) ─────────────────────────────────────────
SENIORITY_MAP = {
    "Unknown": 0, "Internship": 1, "Entry level": 2, "Associate": 3,
    "Mid-Senior level": 4, "Director": 5, "Executive": 6,
}
EXP_LEVEL_MAP = SENIORITY_MAP.copy()

DOMAIN_COLUMNS = [
    "dom_Machine_Learning___AI", "dom_Data_Science___Analytics",
    "dom_Data_Engineering",      "dom_Cloud___DevOps",
    "dom_Software_Engineering",  "dom_Cybersecurity",
    "dom_Business_Intelligence", "dom_Project_Management",
    "dom_Business_Analysis",     "dom_Finance___FinTech",
    "dom_Healthcare___BioTech",  "dom_Blockchain___Web3",
    "dom_IoT___Embedded_Systems","dom_Product_Management",
    "dom_Sales___Marketing",
]

# Keywords that map resume/job text to domain columns
DOMAIN_KEYWORDS: Dict[str, List[str]] = {
    "dom_Machine_Learning___AI":   ["machine learning","deep learning","pytorch","tensorflow","bert","transformers","llm","nlp","ai","artificial intelligence","neural","gpt","hugging face"],
    "dom_Data_Science___Analytics":["data scientist","analytics","statistics","tableau","power bi","pandas","numpy","scikit","regression","visualization"],
    "dom_Data_Engineering":        ["data engineer","pipeline","etl","airflow","kafka","spark","databricks","dbt","snowflake","data warehouse","delta lake"],
    "dom_Cloud___DevOps":          ["aws","gcp","azure","kubernetes","docker","terraform","devops","ci/cd","cloud","helm","argocd","jenkins"],
    "dom_Software_Engineering":    ["software engineer","software developer","full stack","backend","frontend","react","node","typescript","java","python","api","microservice"],
    "dom_Cybersecurity":           ["security","cybersecurity","penetration","vulnerability","siem","zero trust","cissp","ceh","firewall"],
    "dom_Business_Intelligence":   ["business intelligence","bi developer","tableau","power bi","looker","dbt","reporting","dashboards","olap"],
    "dom_Project_Management":      ["project manager","scrum master","agile","pmp","kanban","program manager","sprint","jira"],
    "dom_Business_Analysis":       ["business analyst","requirements","stakeholder","user story","process improvement","gap analysis","brd"],
    "dom_Finance___FinTech":       ["finance","fintech","banking","payment","trading","risk","compliance","investment","financial","blockchain","defi"],
    "dom_Healthcare___BioTech":    ["healthcare","medical","clinical","pharma","biotech","ehr","hipaa","patient","health informatics"],
    "dom_Blockchain___Web3":       ["blockchain","web3","smart contract","solidity","ethereum","defi","nft","crypto"],
    "dom_IoT___Embedded_Systems":  ["iot","embedded","firmware","rtos","raspberry","arduino","fpga","hardware","microcontroller"],
    "dom_Product_Management":      ["product manager","product owner","roadmap","go-to-market","user research","product strategy","okr"],
    "dom_Sales___Marketing":       ["sales","marketing","seo","crm","salesforce","lead generation","growth","digital marketing","content"],
}

# 35 skill codes from mappings/skills.csv (alphabetical order)
SKILL_CODES: List[str] = []  # populated at load time

# ── Global state ───────────────────────────────────────────────────────────────
_state: Dict = {
    "model":           None,
    "job_feat_mat":    None,   # (M, 53) float32 numpy
    "job_ids":         None,   # (M,)    int64 numpy
    "postings_df":     None,
    "loaded":          False,
    "embed_dim":       32,
    "curvature":      -1.0,
}


# ══════════════════════════════════════════════════════════════════════════════
# Feature builders — mirror lorentzfm_experiment/data/dataset.py exactly
# ══════════════════════════════════════════════════════════════════════════════

def _text_to_domain_vector(text: str) -> np.ndarray:
    """Convert free text to 15-dim multi-hot domain vector."""
    text_lower = text.lower()
    vec = np.zeros(15, dtype=np.float32)
    for i, col in enumerate(DOMAIN_COLUMNS):
        kws = DOMAIN_KEYWORDS.get(col, [])
        if any(k in text_lower for k in kws):
            vec[i] = 1.0
    return vec


def _skills_to_domain_vector(skills: List[str]) -> np.ndarray:
    """Convert a list of skill names to a 15-dim domain vector."""
    return _text_to_domain_vector(" ".join(skills).lower())


def _build_resume_vector(
    skills:        List[str],
    seniority:     str = "Unknown",
    edu_score:     int = 3,
    cert_count:    int = 0,
) -> np.ndarray:
    """
    Build a 19-dim resume feature vector.
    [0:15] domain  [15] skill_count  [16] seniority  [17] edu_score  [18] cert_count
    """
    domain_vec  = _skills_to_domain_vector(skills)
    skill_cnt   = np.array([min(len(skills), 80) / 80.0], dtype=np.float32)
    seniority_v = np.array([SENIORITY_MAP.get(seniority, 0) / 6.0], dtype=np.float32)
    edu_v       = np.array([min(edu_score, 4) / 4.0], dtype=np.float32)
    cert_v      = np.array([min(cert_count, 10) / 10.0], dtype=np.float32)
    return np.concatenate([domain_vec, skill_cnt, seniority_v, edu_v, cert_v])


def _build_job_feature_matrix_fast(
    postings_df:   pd.DataFrame,
    job_skills_df: pd.DataFrame,
    skill_code_idx: Dict[str, int],
    ordered_job_ids: np.ndarray,
) -> np.ndarray:
    """
    Build (M, 53) job feature matrix for all jobs in FAISS order.
    Mirrors lorentzfm_experiment/data/dataset.py :: build_job_feature_matrix()
    """
    num_skills = len(skill_code_idx)   # 35
    M = len(ordered_job_ids)

    logger.info("Building job feature matrix (%d × 53)…", M)

    # ── Domain vectors from title + description ─────────────────────────────
    pdf = postings_df.set_index("job_id")

    # Build text blobs
    texts = []
    for jid in ordered_job_ids:
        if jid in pdf.index:
            row   = pdf.loc[jid]
            texts.append(str(row.get("title","")) + " " + str(row.get("description",""))[:200])
        else:
            texts.append("")

    dom_mat = np.vstack([_text_to_domain_vector(t) for t in texts]).astype(np.float32)

    # ── Skill multi-hot (35 dims) ───────────────────────────────────────────
    skill_mat = np.zeros((M, num_skills), dtype=np.float32)
    skill_records = job_skills_df[job_skills_df["skill_abr"].isin(skill_code_idx)]
    skill_records = skill_records.copy()
    skill_records["skill_idx"] = skill_records["skill_abr"].map(skill_code_idx)

    # index skill rows by job_id for fast lookup
    skill_by_job: Dict[int, List[int]] = {}
    for _, sr in skill_records.iterrows():
        jid = int(sr["job_id"])
        idx = int(sr["skill_idx"])
        if jid not in skill_by_job:
            skill_by_job[jid] = []
        skill_by_job[jid].append(idx)

    for row_i, jid in enumerate(ordered_job_ids):
        for si in skill_by_job.get(int(jid), []):
            skill_mat[row_i, si] = 1.0

    # ── Scalar features ─────────────────────────────────────────────────────
    # exp_level from split_manifest if available, else 0
    exp_col       = np.zeros((M, 1), dtype=np.float32)
    has_salary    = np.zeros((M, 1), dtype=np.float32)
    dom_count_col = np.zeros((M, 1), dtype=np.float32)

    if SPLIT_MANIFEST.exists():
        mf = pd.read_csv(SPLIT_MANIFEST, usecols=["job_id","exp_level_label","has_salary","domain_count"])
        mf = mf.set_index("job_id")
        for row_i, jid in enumerate(ordered_job_ids):
            if int(jid) in mf.index:
                r = mf.loc[int(jid)]
                exp_col[row_i, 0]       = EXP_LEVEL_MAP.get(str(r.get("exp_level_label","Unknown")), 0) / 6.0
                has_salary[row_i, 0]    = float(r.get("has_salary", 0))
                dc = float(r.get("domain_count", 0))
                dom_count_col[row_i, 0] = min(dc, 5.0) / 5.0

    feat = np.hstack([dom_mat, skill_mat, exp_col, has_salary, dom_count_col])
    assert feat.shape == (M, 53), f"Expected (M,53) got {feat.shape}"
    logger.info("Job feature matrix built: %s", feat.shape)
    return feat.astype(np.float32)


# ══════════════════════════════════════════════════════════════════════════════
# Load model + data
# ══════════════════════════════════════════════════════════════════════════════

def load_all() -> None:
    """Load LorentzFM model + job feature matrix. Call once at startup."""
    if _state["loaded"]:
        return

    # ── Load LorentzFM model ─────────────────────────────────────────────────
    if not CHECKPOINT.exists():
        logger.error("LorentzFM checkpoint not found: %s", CHECKPOINT)
    else:
        try:
            from lorentzfm_experiment.models.lorentz_fm import LorentzFM
            ckpt   = torch.load(CHECKPOINT, map_location="cpu", weights_only=False)
            cfg    = ckpt.get("config", {})
            embed  = cfg.get("model", {}).get("embedding_dim", 32)
            curv   = cfg.get("model", {}).get("lorentz_curvature", -1.0)
            model  = LorentzFM(embed_dim=embed, curvature=curv)
            model.load_state_dict(ckpt["model_state"])
            model.eval()
            _state["model"]    = model
            _state["embed_dim"] = embed
            _state["curvature"] = curv
            logger.info(
                "LorentzFM loaded — epoch=%d  val_P@10=%.4f  embed_dim=%d",
                ckpt.get("epoch", "?"),
                ckpt.get("val_p10", 0),
                embed,
            )
        except Exception as e:
            logger.error("Failed to load LorentzFM: %s", e)

    # ── Load postings ─────────────────────────────────────────────────────────
    if not DATASET.exists():
        logger.warning("postings.csv not found — fallback mode")
        _state["postings_df"] = pd.DataFrame()
        _state["loaded"]      = True
        return

    logger.info("Loading postings.csv…")
    _state["postings_df"] = pd.read_csv(
        DATASET,
        usecols=["job_id","title","company_name","description","location",
                 "formatted_experience_level","formatted_work_type",
                 "remote_allowed","min_salary","max_salary","pay_period"],
        on_bad_lines="skip", low_memory=False,
    )
    logger.info("Postings loaded: %d rows", len(_state["postings_df"]))

    # ── Load skill codes ──────────────────────────────────────────────────────
    global SKILL_CODES
    if SKILLS_MAP_PATH.exists():
        sm_df = pd.read_csv(SKILLS_MAP_PATH)
        SKILL_CODES = sorted(sm_df["skill_abr"].tolist())
        logger.info("Skill codes loaded: %d", len(SKILL_CODES))
    else:
        # Fallback: 35 placeholder codes
        SKILL_CODES = [f"SK{i:02d}" for i in range(35)]

    skill_code_idx = {c: i for i, c in enumerate(SKILL_CODES)}

    # ── Load job skills ───────────────────────────────────────────────────────
    job_skills_df = pd.DataFrame(columns=["job_id","skill_abr"])
    if JOB_SKILLS_PATH.exists():
        job_skills_df = pd.read_csv(JOB_SKILLS_PATH)
        logger.info("Job skills loaded: %d rows", len(job_skills_df))

    # ── Determine job ordering (FAISS map or postings order) ──────────────────
    if FAISS_MAP_PATH.exists():
        with open(FAISS_MAP_PATH) as f:
            fmap = json.load(f)
        ordered_ids = np.array([fmap[str(i)] for i in range(len(fmap))], dtype=np.int64)
    else:
        ordered_ids = _state["postings_df"]["job_id"].values.astype(np.int64)

    _state["job_ids"] = ordered_ids

    # ── Build job feature matrix ──────────────────────────────────────────────
    _state["job_feat_mat"] = _build_job_feature_matrix_fast(
        _state["postings_df"], job_skills_df, skill_code_idx, ordered_ids,
    )

    _state["loaded"] = True
    logger.info("LorentzFM recommender ready.")


# ══════════════════════════════════════════════════════════════════════════════
# Recommend
# ══════════════════════════════════════════════════════════════════════════════

def recommend_jobs(
    resume_text:   str,
    resume_skills: List[str],
    top_k:         int = 50,
    seniority:     str = "Unknown",
    edu_score:     int = 3,
    cert_count:    int = 0,
) -> List[Dict]:
    """
    Score every job in the dataset with LorentzFM and return top_k ranked results.

    Falls back to domain-overlap scoring if the model or feature matrix
    is not loaded.
    """
    df = _state["postings_df"]
    if df is None or (hasattr(df, "empty") and df.empty):
        return []

    job_feat_mat = _state["job_feat_mat"]
    model        = _state["model"]
    job_ids      = _state["job_ids"]

    # ── Build resume feature vector ───────────────────────────────────────────
    resume_vec = _build_resume_vector(resume_skills, seniority, edu_score, cert_count)

    # ── LorentzFM scoring ─────────────────────────────────────────────────────
    if model is not None and job_feat_mat is not None:
        r_tensor   = torch.from_numpy(resume_vec)
        j_tensor   = torch.from_numpy(job_feat_mat)

        raw_scores = model.score_resume_vs_all_jobs(
            r_tensor, j_tensor, batch_size=2048, device=torch.device("cpu")
        )   # (M,) float32

        # Normalise to [0, 100]: use softmax-like relative percentile
        s_min, s_max = float(raw_scores.min()), float(raw_scores.max())
        s_range = max(s_max - s_min, 1e-6)
        norm_scores = (raw_scores - s_min) / s_range * 99.0   # 0–99

        top_idx = np.argsort(-norm_scores)[:top_k]

    else:
        # ── Keyword-overlap fallback ─────────────────────────────────────────
        logger.warning("LorentzFM model not loaded — using domain-overlap fallback")
        pdf = df.set_index("job_id")
        sample_ids = (job_ids if job_ids is not None
                      else df["job_id"].values.astype(np.int64))
        sample_ids = sample_ids[:min(500, len(sample_ids))]
        scores = np.zeros(len(sample_ids), dtype=np.float32)
        for i, jid in enumerate(sample_ids):
            if int(jid) in pdf.index:
                desc = str(pdf.loc[int(jid)].get("description", ""))
                hits = sum(1 for s in resume_skills if s.lower() in desc.lower())
                scores[i] = hits / max(len(resume_skills), 1) * 99.0
        top_idx = np.argsort(-scores)[:top_k]
        norm_scores = scores
        job_ids = sample_ids

    # ── Build result list ─────────────────────────────────────────────────────
    pdf     = df.set_index("job_id")
    results = []
    resume_domain_vec = _skills_to_domain_vector(resume_skills)

    for idx in top_idx:
        jid   = int(job_ids[idx])
        score = float(norm_scores[idx])

        if jid not in pdf.index:
            continue
        row = pdf.loc[jid]

        desc     = str(row.get("description", ""))
        matched  = [s for s in resume_skills if s.lower() in desc.lower()]
        results.append(_build_job_dict(row, str(jid), score, matched))

    return sorted(results, key=lambda x: x["match_score"], reverse=True)


def _build_job_dict(row, job_id: str, match_score: float, matched_skills: List[str]) -> Dict:
    title   = str(row.get("title",        ""))
    company = str(row.get("company_name", "Unknown"))
    location= str(row.get("location",     ""))
    desc    = str(row.get("description",  ""))[:500]

    domain_map = {
        "ML/AI":               ["machine learning","deep learning","nlp","ai","artificial intelligence"],
        "Data Science":        ["data scientist","analytics","statistics","spark"],
        "Data Engineering":    ["data engineer","pipeline","etl","airflow","kafka"],
        "Cloud/DevOps":        ["cloud","devops","kubernetes","terraform","aws","gcp","azure"],
        "Software Engineering":["software engineer","developer","full stack","backend","frontend"],
        "Research":            ["research","scientist","phd","academic"],
    }
    domain   = "Software Engineering"
    combined = (title + " " + desc[:200]).lower()
    for dom, kws in domain_map.items():
        if any(k in combined for k in kws):
            domain = dom
            break

    return {
        "job_id":           job_id,
        "title":            title,
        "company_name":     company,
        "location":         location,
        "description":      desc,
        "work_type":        str(row.get("formatted_work_type",      "Full-time")),
        "experience_level": str(row.get("formatted_experience_level","Mid-Senior level")),
        "remote_allowed":   bool(row.get("remote_allowed",          False)),
        "industry":         "Technology",
        "domain":           domain,
        "match_score":      min(99.0, round(match_score, 1)),
        "matched_skills":   matched_skills[:10],
        "min_salary":       row.get("min_salary") if pd.notna(row.get("min_salary")) else None,
        "max_salary":       row.get("max_salary") if pd.notna(row.get("max_salary")) else None,
        "pay_period":       row.get("pay_period") if pd.notna(row.get("pay_period")) else None,
        "posted_days_ago":  7,
        "applies":          100,
        "skills_desc":      matched_skills,
        "company_size":     "1,001–5,000 employees",
        "url":              "#",
    }


def get_status() -> Dict:
    return {
        "lorentzfm_loaded":  _state["model"] is not None,
        "features_loaded":   _state["job_feat_mat"] is not None,
        "jobs_indexed":      int(len(_state["job_ids"])) if _state["job_ids"] is not None else 0,
        "embed_dim":         _state["embed_dim"],
        "checkpoint":        str(CHECKPOINT) if CHECKPOINT.exists() else "not found",
    }
