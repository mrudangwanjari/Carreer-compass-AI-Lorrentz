"""
dataset.py
==========
Feature loading, encoding, and dataset utilities for LorentzFM Baseline Experiment.

CareerCompass AI — Research Baseline Comparison
Isolated from production pipeline. Do NOT import into CareerCompass AI.

Feature Design
--------------
Resume (19-dim structured vector):
  [0:15]  domain vector (15-dim multi-hot binary)  ← primary relevance signal
  [15]    skill_count  (scalar, normalised)
  [16]    seniority_level (ordinal 0–6)
  [17]    education_score (scalar 1–4, normalised)
  [18]    cert_count (scalar, normalised)

Job (53-dim structured vector):
  [0:15]  domain vector (15-dim multi-hot binary)  ← primary relevance signal
  [15:50] skill code vector (35-dim multi-hot binary)
  [50]    experience_level (ordinal 0–6)
  [51]    has_salary (binary 0/1)
  [52]    domain_count (scalar, normalised)

Relevance label (ground truth, identical to SBERT/BERT):
  relevant = 1 iff np.dot(resume_domain_vec, job_domain_vec) > 0
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Seniority / Experience ordinal maps ────────────────────────────────────────
SENIORITY_MAP = {
    "Unknown": 0,
    "Internship": 1,
    "Entry level": 2,
    "Associate": 3,
    "Mid-Senior level": 4,
    "Director": 5,
    "Executive": 6,
}

EXP_LEVEL_MAP = {
    "Unknown": 0,
    "Internship": 1,
    "Entry level": 2,
    "Associate": 3,
    "Mid-Senior level": 4,
    "Director": 5,
    "Executive": 6,
}

DOMAIN_COLUMNS = [
    "dom_Machine_Learning___AI",
    "dom_Data_Science___Analytics",
    "dom_Data_Engineering",
    "dom_Cloud___DevOps",
    "dom_Software_Engineering",
    "dom_Cybersecurity",
    "dom_Business_Intelligence",
    "dom_Project_Management",
    "dom_Business_Analysis",
    "dom_Finance___FinTech",
    "dom_Healthcare___BioTech",
    "dom_Blockchain___Web3",
    "dom_IoT___Embedded_Systems",
    "dom_Product_Management",
    "dom_Sales___Marketing",
]

RESUME_FEATURE_DIM = 19   # 15 domain + 4 scalars
JOB_FEATURE_DIM   = 53   # 15 domain + 35 skills + 3 scalars


# ══════════════════════════════════════════════════════════════════════════════
# Helper: scalar normalisation
# ══════════════════════════════════════════════════════════════════════════════

def _norm_scalar(series: pd.Series, clip_max: float) -> pd.Series:
    """Clip to [0, clip_max] then divide by clip_max → [0, 1]."""
    return series.fillna(0.0).clip(0, clip_max) / clip_max


# ══════════════════════════════════════════════════════════════════════════════
# Resume feature builder
# ══════════════════════════════════════════════════════════════════════════════

def build_resume_feature_matrix(
    resumes_path: Path,
    resume_domain_path: Path,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns
    -------
    resume_ids   : (N,)    int64 array of resume_id values
    feature_mat  : (N, 19) float32 feature matrix
    """
    resumes_df = pd.read_csv(resumes_path)
    dom_df     = pd.read_csv(resume_domain_path)

    # Merge on resume_id
    df = resumes_df.merge(dom_df, on="resume_id", how="left")

    # ── Domain vector [0:15] ──────────────────────────────────────────────────
    dom_mat = df[DOMAIN_COLUMNS].fillna(0).values.astype(np.float32)

    # ── Scalar features ───────────────────────────────────────────────────────
    skill_count    = _norm_scalar(df["skill_count"], clip_max=80.0).values.reshape(-1, 1).astype(np.float32)
    seniority      = df["seniority_level"].map(SENIORITY_MAP).fillna(0).values.reshape(-1, 1).astype(np.float32) / 6.0
    edu_score      = _norm_scalar(df["education_score"], clip_max=4.0).values.reshape(-1, 1).astype(np.float32)
    cert_count     = _norm_scalar(df["cert_count"], clip_max=10.0).values.reshape(-1, 1).astype(np.float32)

    feature_mat = np.hstack([dom_mat, skill_count, seniority, edu_score, cert_count])

    resume_ids = df["resume_id"].values.astype(np.int64)
    logger.info("Resume feature matrix: %s  (ids: %d)", feature_mat.shape, len(resume_ids))
    return resume_ids, feature_mat


# ══════════════════════════════════════════════════════════════════════════════
# Job feature builder
# ══════════════════════════════════════════════════════════════════════════════

def build_job_feature_matrix(
    domain_labels_path: Path,
    split_manifest_path: Path,
    job_skills_path: Path,
    skills_mapping_path: Path,
    faiss_id_map_path: Path,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns
    -------
    job_ids      : (M,)    int64 array of job_id values (in FAISS index order)
    feature_mat  : (M, 53) float32 feature matrix
    """
    # ── Load domain labels ────────────────────────────────────────────────────
    dom_df = pd.read_csv(domain_labels_path)
    logger.info("Loaded domain_labels_wide: %d rows", len(dom_df))

    # ── Load split manifest for structured fields ─────────────────────────────
    manifest_df = pd.read_csv(split_manifest_path, usecols=[
        "job_id", "exp_level_label", "has_salary", "domain_count"
    ])
    logger.info("Loaded split_manifest: %d rows", len(manifest_df))

    # ── Load skill codes → 35-dim multi-hot ───────────────────────────────────
    skills_map_df  = pd.read_csv(skills_mapping_path)
    skill_codes    = sorted(skills_map_df["skill_abr"].tolist())         # 35 codes, alphabetical
    skill_code_idx = {code: i for i, code in enumerate(skill_codes)}
    num_skills     = len(skill_codes)                                    # 35

    job_skills_df = pd.read_csv(job_skills_path)
    # Build multi-hot: group by job_id
    skill_records = job_skills_df[job_skills_df["skill_abr"].isin(skill_code_idx)].copy()
    skill_records["skill_idx"] = skill_records["skill_abr"].map(skill_code_idx)

    # Pivot to wide (job_id × 35)
    skill_pivot = (
        skill_records
        .groupby("job_id")["skill_idx"]
        .apply(list)
        .reset_index(name="skill_indices")
    )
    logger.info("Jobs with skill codes: %d", len(skill_pivot))

    # ── Load FAISS ID map to get canonical job ordering ───────────────────────
    with open(faiss_id_map_path, "r", encoding="utf-8") as f:
        faiss_map = json.load(f)                    # {"0": job_id, "1": job_id, ...}
    ordered_job_ids = np.array(
        [faiss_map[str(i)] for i in range(len(faiss_map))], dtype=np.int64
    )
    M = len(ordered_job_ids)
    logger.info("FAISS job order: %d jobs", M)

    # ── Merge everything, preserving FAISS order ──────────────────────────────
    base_df = pd.DataFrame({"job_id": ordered_job_ids})

    # Domain vectors
    base_df = base_df.merge(
        dom_df[["job_id"] + DOMAIN_COLUMNS + ["domain_count", "has_domain"]],
        on="job_id", how="left"
    )

    # Manifest fields
    base_df = base_df.merge(manifest_df, on="job_id", how="left")

    # Skill multi-hot
    base_df = base_df.merge(skill_pivot, on="job_id", how="left")

    # ── Build feature matrix ───────────────────────────────────────────────────
    # [0:15]  domain vector
    dom_mat = base_df[DOMAIN_COLUMNS].fillna(0).values.astype(np.float32)

    # [15:50] skill multi-hot (35 dims)
    skill_mat = np.zeros((M, num_skills), dtype=np.float32)
    for row_idx, indices in enumerate(base_df["skill_indices"].values):
        if isinstance(indices, list):
            for si in indices:
                skill_mat[row_idx, si] = 1.0

    # [50]    experience_level  (ordinal 0–6, normalised)
    exp_col = base_df["exp_level_label"].map(EXP_LEVEL_MAP).fillna(0).values.reshape(-1, 1).astype(np.float32) / 6.0

    # [51]    has_salary (binary)
    has_salary = base_df["has_salary"].fillna(0).values.reshape(-1, 1).astype(np.float32)

    # [52]    domain_count (normalised 0–5)
    dom_count_col = (
        base_df["domain_count_x"]
        if "domain_count_x" in base_df.columns
        else base_df["domain_count"]
    )
    dom_count = _norm_scalar(dom_count_col, clip_max=5.0).values.reshape(-1, 1).astype(np.float32)

    feature_mat = np.hstack([dom_mat, skill_mat, exp_col, has_salary, dom_count])

    logger.info("Job feature matrix: %s  (M=%d, dim=%d)", feature_mat.shape, M, feature_mat.shape[1])
    assert feature_mat.shape == (M, JOB_FEATURE_DIM), (
        f"Expected ({M}, {JOB_FEATURE_DIM}), got {feature_mat.shape}"
    )
    return ordered_job_ids, feature_mat


# ══════════════════════════════════════════════════════════════════════════════
# Relevance label computation (identical to SBERT/BERT ground truth)
# ══════════════════════════════════════════════════════════════════════════════

def compute_relevance_matrix(
    resume_domain_mat: np.ndarray,   # (N, 15)
    job_domain_mat:    np.ndarray,   # (M, 15)
) -> np.ndarray:
    """
    Returns (N, M) bool matrix.
    relevant[i, j] = True  iff  dot(resume_domain[i], job_domain[j]) > 0
    (Identical ground-truth definition to SBERT and BERT baselines.)
    """
    # dot product: (N, 15) @ (15, M) → (N, M)
    dot = resume_domain_mat @ job_domain_mat.T
    return (dot > 0).astype(np.bool_)


# ══════════════════════════════════════════════════════════════════════════════
# LorentzFM pair dataset  (training / validation)
# ══════════════════════════════════════════════════════════════════════════════

class LorentzFMPairDataset(Dataset):
    """
    Pairwise dataset for BPR training.

    Each sample contains:
        resume_feat   : (RESUME_FEATURE_DIM,) float32
        pos_job_feat  : (JOB_FEATURE_DIM,)    float32  — relevant job
        neg_job_feat  : (JOB_FEATURE_DIM,)    float32  — randomly sampled irrelevant job

    Negative sampling strategy
    --------------------------
    - Negatives are drawn from the TRAINING split only (never val/test).
    - For each positive (resume, job) pair, `num_negatives` jobs are sampled
      at random from the training pool, retrying if the sampled job is
      relevant to the resume (i.e. dot(resume_domain, job_domain) > 0).
    - Max retry = 20 to keep things fast; if a truly negative sample is not
      found within retries, the last candidate is used (label noise accepted).
    """

    def __init__(
        self,
        training_pairs_path:  Path,
        resume_ids:           np.ndarray,     # (N,)
        resume_feat_mat:      np.ndarray,     # (N, 19)
        job_ids:              np.ndarray,     # (M,)
        job_feat_mat:         np.ndarray,     # (M, 53)
        split_manifest_path:  Path,
        split:                str = "train",  # "train" or "val"
        num_negatives:        int = 4,
        random_seed:          int = 42,
    ):
        super().__init__()
        self.num_negatives = num_negatives
        self.rng = np.random.default_rng(random_seed)

        # Index maps
        self.resume_id_to_idx = {int(rid): i for i, rid in enumerate(resume_ids)}
        self.job_id_to_idx    = {int(jid): i for i, jid in enumerate(job_ids)}

        self.resume_feat_mat = resume_feat_mat   # (N, 19)
        self.job_feat_mat    = job_feat_mat       # (M, 53)

        # ── Load training pairs ────────────────────────────────────────────────
        pairs_df = pd.read_csv(training_pairs_path)
        pairs_df = pairs_df[pairs_df["label"] == 1]   # keep only positives

        # Filter to pairs where both resume and job are known
        pairs_df = pairs_df[
            pairs_df["resume_id"].isin(self.resume_id_to_idx) &
            pairs_df["job_id"].isin(self.job_id_to_idx)
        ].reset_index(drop=True)
        logger.info("LorentzFMPairDataset: %d positive pairs loaded", len(pairs_df))

        self.resume_indices = pairs_df["resume_id"].map(self.resume_id_to_idx).values
        self.pos_job_indices = pairs_df["job_id"].map(self.job_id_to_idx).values

        # ── Build negative sampling pool (train-split job indices only) ────────
        manifest_df = pd.read_csv(split_manifest_path, usecols=["job_id", "split"])
        train_job_ids = set(manifest_df[manifest_df["split"] == "train"]["job_id"].tolist())
        self.neg_pool = np.array(
            [self.job_id_to_idx[jid] for jid in train_job_ids if jid in self.job_id_to_idx],
            dtype=np.int64,
        )
        logger.info("Negative sampling pool (train-split jobs): %d", len(self.neg_pool))

        # ── Pre-compute resume domain vectors for fast relevance check ─────────
        self.resume_domain_mat = resume_feat_mat[:, :15]    # (N, 15)
        self.job_domain_mat    = job_feat_mat[:, :15]       # (M, 15)

    def __len__(self) -> int:
        return len(self.resume_indices) * self.num_negatives

    def __getitem__(self, idx: int) -> Dict:
        pair_idx = idx // self.num_negatives
        r_idx    = int(self.resume_indices[pair_idx])
        p_idx    = int(self.pos_job_indices[pair_idx])

        resume_dom = self.resume_domain_mat[r_idx]   # (15,)

        # ── Sample one negative ────────────────────────────────────────────────
        for _ in range(20):
            n_idx = int(self.rng.choice(self.neg_pool))
            job_dom = self.job_domain_mat[n_idx]
            if np.dot(resume_dom, job_dom) == 0:
                break   # found a true negative

        return {
            "resume_feat":  torch.from_numpy(self.resume_feat_mat[r_idx].copy()),
            "pos_job_feat": torch.from_numpy(self.job_feat_mat[p_idx].copy()),
            "neg_job_feat": torch.from_numpy(self.job_feat_mat[n_idx].copy()),
        }


# ══════════════════════════════════════════════════════════════════════════════
# Evaluation dataset (all jobs, one resume at a time)
# ══════════════════════════════════════════════════════════════════════════════

class LorentzFMEvalDataset(Dataset):
    """
    Returns all job feature vectors for a single resume during evaluation.
    Used for batch-scoring the full 123,849-job candidate pool.
    """

    def __init__(self, job_feat_mat: np.ndarray):
        self.job_feat_mat = job_feat_mat   # (M, 53)

    def __len__(self) -> int:
        return len(self.job_feat_mat)

    def __getitem__(self, idx: int) -> torch.Tensor:
        return torch.from_numpy(self.job_feat_mat[idx].copy())


# ══════════════════════════════════════════════════════════════════════════════
# Convenience loader
# ══════════════════════════════════════════════════════════════════════════════

def load_all_features(config: Dict) -> Dict:
    """
    Load all feature matrices and ID arrays from config paths.

    Returns dict with keys:
        resume_ids, resume_feat_mat,
        job_ids, job_feat_mat,
        relevance_mat   (N × M bool, computed on-the-fly)
    """
    ds_cfg = config["dataset"]

    resume_ids, resume_feat_mat = build_resume_feature_matrix(
        resumes_path        = Path(ds_cfg["resumes"]["path"]),
        resume_domain_path  = Path(ds_cfg["resumes"]["domain_label_path"]),
    )

    job_ids, job_feat_mat = build_job_feature_matrix(
        domain_labels_path  = Path(ds_cfg["jobs"]["domain_label_path"]),
        split_manifest_path = Path(ds_cfg["split"]["manifest_path"]),
        job_skills_path     = Path(ds_cfg["jobs"]["job_skills_path"]),
        skills_mapping_path = Path(ds_cfg["jobs"]["skills_mapping_path"]),
        faiss_id_map_path   = Path(ds_cfg["jobs"]["faiss_id_map_path"]),
    )

    # Relevance matrix (N × M bool)
    relevance_mat = compute_relevance_matrix(
        resume_feat_mat[:, :15],
        job_feat_mat[:, :15],
    )
    logger.info(
        "Relevance matrix: %s  (%.1f%% positive pairs)",
        relevance_mat.shape,
        100.0 * relevance_mat.sum() / relevance_mat.size,
    )

    return {
        "resume_ids":      resume_ids,
        "resume_feat_mat": resume_feat_mat,
        "job_ids":         job_ids,
        "job_feat_mat":    job_feat_mat,
        "relevance_mat":   relevance_mat,
    }
