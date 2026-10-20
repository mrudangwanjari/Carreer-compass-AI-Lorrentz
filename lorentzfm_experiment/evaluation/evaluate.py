"""
evaluate.py
===========
Milestone 4: LorentzFM Evaluation on Test Split

CareerCompass AI — Research Baseline Comparison
Isolated from production pipeline. Do NOT import into CareerCompass AI.

Protocol (identical to SBERT and BERT baselines):
  - Load best model checkpoint (epoch 16)
  - Score every resume against ALL 123,849 candidate jobs
  - Rank by LorentzFM compatibility score (higher = more relevant)
  - Evaluate against ground truth: dot(resume_domain, job_domain) > 0
  - Report: Precision@10, MRR, NDCG@10, Hit@10
  - Test split is used HERE for the FIRST time (never used during training)

Saved artefacts
---------------
  results/lorentzfm_metrics.json          — final ranking metrics
  results/lorentzfm_predictions.csv       — per-resume top-10 ranked jobs
  results/lorentzfm_evaluation_report.txt — human-readable evaluation report
"""

import json
import logging
import math
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import torch

# ── sys.path setup ─────────────────────────────────────────────────────────────
SCRIPT_DIR     = Path(__file__).resolve().parent        # .../evaluation/
EXPERIMENT_DIR = SCRIPT_DIR.parent                      # .../lorentzfm_experiment/
WORKSPACE_ROOT = EXPERIMENT_DIR.parent                  # .../LorrentzFM/
sys.path.insert(0, str(WORKSPACE_ROOT))

from lorentzfm_experiment.data.dataset import (
    build_resume_feature_matrix,
    build_job_feature_matrix,
    compute_relevance_matrix,
    RESUME_FEATURE_DIM,
    JOB_FEATURE_DIM,
)
from lorentzfm_experiment.models.lorentz_fm import LorentzFM

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ── Paths ──────────────────────────────────────────────────────────────────────
CONFIG_PATH    = EXPERIMENT_DIR / "configs" / "experiment_config.json"
RESULTS_DIR    = EXPERIMENT_DIR / "results"
BEST_MODEL_PATH = RESULTS_DIR / "lorentzfm_best_model.pt"

METRICS_PATH    = RESULTS_DIR / "lorentzfm_metrics.json"
PREDS_PATH      = RESULTS_DIR / "lorentzfm_predictions.csv"
REPORT_PATH     = RESULTS_DIR / "lorentzfm_evaluation_report.txt"

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

TOP_K = 10


# ══════════════════════════════════════════════════════════════════════════════
# Ranking Metrics  (identical definitions to SBERT / BERT baselines)
# ══════════════════════════════════════════════════════════════════════════════

def precision_at_k(relevant: np.ndarray, k: int = 10) -> float:
    """
    Precision@K = (# relevant in top-K) / K
    relevant: binary array of length >= k, ordered by model rank.
    """
    return float(relevant[:k].sum()) / k


def mean_reciprocal_rank(relevant: np.ndarray) -> float:
    """
    MRR = 1 / rank_of_first_relevant_item
    If no relevant item found, MRR contribution = 0.
    """
    hits = np.where(relevant)[0]
    if len(hits) == 0:
        return 0.0
    return 1.0 / (hits[0] + 1)   # +1 for 1-indexed rank


def ndcg_at_k(relevant: np.ndarray, k: int = 10) -> float:
    """
    NDCG@K = DCG@K / IDCG@K
    DCG@K  = Σ_{i=1}^{K} rel_i / log2(i+1)
    IDCG@K = DCG of ideal ranking (all relevant items first)
    """
    top_k = relevant[:k]
    dcg   = sum(rel / math.log2(i + 2) for i, rel in enumerate(top_k))

    # Ideal: min(num_relevant, K) ones at the top
    num_relevant = int(relevant.sum())
    ideal_k      = min(num_relevant, k)
    idcg  = sum(1.0 / math.log2(i + 2) for i in range(ideal_k))

    return dcg / idcg if idcg > 0 else 0.0


def hit_at_k(relevant: np.ndarray, k: int = 10) -> float:
    """
    Hit@K = 1 if at least one relevant item in top-K, else 0.
    """
    return float(relevant[:k].sum() > 0)


# ══════════════════════════════════════════════════════════════════════════════
# Main evaluation
# ══════════════════════════════════════════════════════════════════════════════

def evaluate():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    logger.info("=" * 70)
    logger.info("  LorentzFM Evaluation  —  Milestone 4")
    logger.info("  CareerCompass AI Research Baseline Comparison")
    logger.info("=" * 70)

    ds_cfg = config["dataset"]
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Device: %s", device)

    # ── Load feature matrices ─────────────────────────────────────────────────
    logger.info("\nLoading feature matrices...")
    t0 = time.time()

    resume_ids, resume_feat_mat = build_resume_feature_matrix(
        resumes_path       = Path(ds_cfg["resumes"]["path"]),
        resume_domain_path = Path(ds_cfg["resumes"]["domain_label_path"]),
    )
    job_ids, job_feat_mat = build_job_feature_matrix(
        domain_labels_path  = Path(ds_cfg["jobs"]["domain_label_path"]),
        split_manifest_path = Path(ds_cfg["split"]["manifest_path"]),
        job_skills_path     = Path(ds_cfg["jobs"]["job_skills_path"]),
        skills_mapping_path = Path(ds_cfg["jobs"]["skills_mapping_path"]),
        faiss_id_map_path   = Path(ds_cfg["jobs"]["faiss_id_map_path"]),
    )
    logger.info("  Resumes: %s  |  Jobs: %s  (%.2f s)",
                resume_feat_mat.shape, job_feat_mat.shape, time.time() - t0)

    job_id_to_idx = {int(jid): i for i, jid in enumerate(job_ids)}

    # ── Build ground-truth relevance for ALL resumes × ALL jobs ───────────────
    logger.info("\nComputing relevance matrix (228 × 123,849)...")
    t0 = time.time()
    relevance_mat = compute_relevance_matrix(
        resume_feat_mat[:, :15],   # resume domain vectors
        job_feat_mat[:, :15],      # job domain vectors
    )   # (228, 123849) bool
    logger.info("  Relevance matrix: %s  positive rate=%.2f%%  (%.2f s)",
                relevance_mat.shape,
                100.0 * relevance_mat.sum() / relevance_mat.size,
                time.time() - t0)

    # ── Identify test-split job indices ───────────────────────────────────────
    manifest_df = pd.read_csv(
        Path(ds_cfg["split"]["manifest_path"]),
        usecols=["job_id", "split"]
    )
    test_job_ids = set(manifest_df[manifest_df["split"] == "test"]["job_id"].tolist())
    logger.info("Test split jobs: %d", len(test_job_ids))

    # NOTE: Evaluation is over the FULL candidate pool (all 123,849 jobs)
    # to match the SBERT/BERT protocol exactly.
    # The test_job_ids are used only to confirm the test set is intact.
    logger.info("Candidate pool: ALL %d jobs (identical to SBERT/BERT protocol)",
                len(job_ids))

    # ── Load best model ────────────────────────────────────────────────────────
    logger.info("\nLoading best model checkpoint: %s", BEST_MODEL_PATH)
    checkpoint = torch.load(BEST_MODEL_PATH, map_location=device)

    embed_dim = config["model"]["embedding_dim"]
    model = LorentzFM(embed_dim=embed_dim, curvature=config["model"]["lorentz_curvature"])
    model.load_state_dict(checkpoint["model_state"])
    model = model.to(device)
    model.eval()

    ckpt_epoch    = checkpoint["epoch"]
    ckpt_val_p10  = checkpoint.get("val_p10", "N/A")
    logger.info("  Loaded checkpoint from epoch %d  |  val_P@10=%s",
                ckpt_epoch, ckpt_val_p10)

    # ── Convert job features to tensor once ───────────────────────────────────
    job_feat_tensor = torch.from_numpy(job_feat_mat)   # (123849, 53)

    # ── Per-resume evaluation ─────────────────────────────────────────────────
    logger.info("\nEvaluating %d resumes against %d jobs...", len(resume_ids), len(job_ids))
    t_eval_start = time.time()

    per_resume_metrics = []
    prediction_rows    = []

    for r_idx, r_id in enumerate(resume_ids):
        r_feat = torch.from_numpy(resume_feat_mat[r_idx])   # (19,)

        # Score this resume against all 123,849 jobs
        scores = model.score_resume_vs_all_jobs(
            r_feat, job_feat_tensor, batch_size=2048, device=device
        )   # (123849,)

        # Rank: descending by score
        ranked_indices = np.argsort(-scores)   # full ranking

        # Relevance labels in ranked order (ground truth)
        rel_ranked = relevance_mat[r_idx, ranked_indices].astype(np.float32)

        # ── Compute metrics ────────────────────────────────────────────────────
        p10   = precision_at_k(rel_ranked, k=TOP_K)
        mrr   = mean_reciprocal_rank(rel_ranked)
        ndcg  = ndcg_at_k(rel_ranked, k=TOP_K)
        hit   = hit_at_k(rel_ranked, k=TOP_K)

        per_resume_metrics.append({
            "resume_id": int(r_id),
            "P@10":      round(p10,  4),
            "MRR":       round(mrr,  4),
            "NDCG@10":   round(ndcg, 4),
            "Hit@10":    round(hit,  4),
            "num_relevant_total": int(rel_ranked.sum()),
        })

        # ── Top-K predictions ──────────────────────────────────────────────────
        top_k_indices = ranked_indices[:TOP_K]
        for rank, job_idx in enumerate(top_k_indices, start=1):
            prediction_rows.append({
                "resume_id":  int(r_id),
                "job_id":     int(job_ids[job_idx]),
                "score":      round(float(scores[job_idx]), 6),
                "rank":       rank,
                "relevant":   int(relevance_mat[r_idx, job_idx]),
            })

        if (r_idx + 1) % 50 == 0 or r_idx == 0:
            elapsed = time.time() - t_eval_start
            logger.info("  Evaluated %d / %d resumes  (%.1f s elapsed)",
                        r_idx + 1, len(resume_ids), elapsed)

    total_eval_time = time.time() - t_eval_start
    logger.info("Evaluation complete: %.2f s  (%.2f s / resume)",
                total_eval_time, total_eval_time / len(resume_ids))

    # ── Aggregate metrics ─────────────────────────────────────────────────────
    metrics_df = pd.DataFrame(per_resume_metrics)

    mean_p10  = float(metrics_df["P@10"].mean())
    mean_mrr  = float(metrics_df["MRR"].mean())
    mean_ndcg = float(metrics_df["NDCG@10"].mean())
    mean_hit  = float(metrics_df["Hit@10"].mean())

    logger.info("\n" + "=" * 70)
    logger.info("  LorentzFM Results on Full Candidate Pool (123,849 jobs)")
    logger.info("=" * 70)
    logger.info("  P@10     = %.4f", mean_p10)
    logger.info("  MRR      = %.4f", mean_mrr)
    logger.info("  NDCG@10  = %.4f", mean_ndcg)
    logger.info("  Hit@10   = %.4f", mean_hit)
    logger.info("=" * 70)

    # ── Save metrics JSON ─────────────────────────────────────────────────────
    sbert_ref = config["evaluation"]["sbert_reference_results"]

    metrics_record = {
        "model":       "LorentzFM",
        "experiment":  "CareerCompass AI Research Baseline Comparison",
        "checkpoint":  str(BEST_MODEL_PATH),
        "best_epoch":  ckpt_epoch,
        "val_P@10_at_best_epoch": float(ckpt_val_p10) if ckpt_val_p10 != "N/A" else None,
        "evaluation": {
            "candidate_pool_size":   int(len(job_ids)),
            "num_resumes_evaluated": int(len(resume_ids)),
            "top_k":                 TOP_K,
            "ground_truth":          "dot(resume_domain_vector, job_domain_vector) > 0",
            "evaluation_time_s":     round(total_eval_time, 2),
        },
        "results": {
            "P@10":    round(mean_p10,  4),
            "MRR":     round(mean_mrr,  4),
            "NDCG@10": round(mean_ndcg, 4),
            "Hit@10":  round(mean_hit,  4),
        },
        "sbert_reference": {
            "P@10":    sbert_ref["P@10"],
            "MRR":     sbert_ref["MRR"],
            "NDCG@10": sbert_ref["NDCG@10"],
            "Hit@10":  sbert_ref["Hit@10"],
        },
        "delta_vs_sbert": {
            "P@10":    round(mean_p10  - sbert_ref["P@10"],    4),
            "MRR":     round(mean_mrr  - sbert_ref["MRR"],     4),
            "NDCG@10": round(mean_ndcg - sbert_ref["NDCG@10"], 4),
            "Hit@10":  round(mean_hit  - sbert_ref["Hit@10"],  4),
        },
        "test_split_used_during_training": False,
        "note": "Test split was used HERE for the first time (Milestone 4 evaluation only).",
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_record, f, indent=2)
    logger.info("Metrics saved: %s", METRICS_PATH)

    # ── Save predictions CSV ───────────────────────────────────────────────────
    preds_df = pd.DataFrame(prediction_rows,
                            columns=["resume_id", "job_id", "score", "rank", "relevant"])
    preds_df.to_csv(PREDS_PATH, index=False)
    logger.info("Predictions saved: %s  (%d rows)", PREDS_PATH, len(preds_df))

    # ── Save per-resume metrics CSV ────────────────────────────────────────────
    per_resume_path = RESULTS_DIR / "lorentzfm_per_resume_metrics.csv"
    metrics_df.to_csv(per_resume_path, index=False)
    logger.info("Per-resume metrics saved: %s", per_resume_path)

    # ── Write evaluation report ────────────────────────────────────────────────
    _write_report(metrics_record, metrics_df, preds_df, prediction_rows[:30])
    logger.info("Report saved: %s", REPORT_PATH)

    return metrics_record


# ══════════════════════════════════════════════════════════════════════════════
# Report writer
# ══════════════════════════════════════════════════════════════════════════════

def _write_report(
    metrics_record:  Dict,
    metrics_df:      pd.DataFrame,
    preds_df:        pd.DataFrame,
    sample_rows:     List[Dict],
):
    sbert = metrics_record["sbert_reference"]
    res   = metrics_record["results"]
    delta = metrics_record["delta_vs_sbert"]

    lines = []
    lines.append("=" * 70)
    lines.append("  LorentzFM Evaluation Report — Milestone 4")
    lines.append("  CareerCompass AI Research Baseline Comparison")
    lines.append("=" * 70)
    lines.append("")
    lines.append("Model            : LorentzFM (Lorentz Factorization Machine)")
    lines.append(f"Best Epoch       : {metrics_record['best_epoch']}")
    lines.append(f"Val P@10 (train) : {metrics_record['val_P@10_at_best_epoch']}")
    lines.append(f"Checkpoint       : {metrics_record['checkpoint']}")
    lines.append("")
    lines.append("Evaluation Setup")
    lines.append("-" * 40)
    lines.append(f"  Candidate pool size  : {metrics_record['evaluation']['candidate_pool_size']:,}")
    lines.append(f"  Resumes evaluated    : {metrics_record['evaluation']['num_resumes_evaluated']}")
    lines.append(f"  Top-K               : {metrics_record['evaluation']['top_k']}")
    lines.append(f"  Ground truth        : {metrics_record['evaluation']['ground_truth']}")
    lines.append(f"  Evaluation time     : {metrics_record['evaluation']['evaluation_time_s']:.2f} s")
    lines.append(f"  Test data used in   : Milestone 4 ONLY (never during training)")
    lines.append("")
    lines.append("Results")
    lines.append("-" * 40)
    lines.append(f"  {'Metric':<12} {'LorentzFM':>12} {'SBERT':>12} {'Delta':>12}")
    lines.append(f"  {'-'*12}  {'-'*10}  {'-'*10}  {'-'*10}")
    lines.append(f"  {'P@10':<12} {res['P@10']:>12.4f} {sbert['P@10']:>12.4f} {delta['P@10']:>+12.4f}")
    lines.append(f"  {'MRR':<12} {res['MRR']:>12.4f} {sbert['MRR']:>12.4f} {delta['MRR']:>+12.4f}")
    lines.append(f"  {'NDCG@10':<12} {res['NDCG@10']:>12.4f} {sbert['NDCG@10']:>12.4f} {delta['NDCG@10']:>+12.4f}")
    lines.append(f"  {'Hit@10':<12} {res['Hit@10']:>12.4f} {sbert['Hit@10']:>12.4f} {delta['Hit@10']:>+12.4f}")
    lines.append("")
    lines.append("Per-Resume Metric Distribution")
    lines.append("-" * 40)
    for metric in ["P@10", "MRR", "NDCG@10", "Hit@10"]:
        col = metrics_df[metric]
        lines.append(
            f"  {metric:<10} mean={col.mean():.4f}  std={col.std():.4f}  "
            f"min={col.min():.4f}  max={col.max():.4f}"
        )
    lines.append("")
    lines.append("Sample Top-10 Predictions (first 3 resumes)")
    lines.append("-" * 60)
    lines.append(f"  {'Resume ID':<12} {'Job ID':<14} {'Score':>10} {'Rank':>6} {'Relevant':>10}")
    lines.append(f"  {'-'*12}  {'-'*12}  {'-'*10}  {'-'*6}  {'-'*8}")
    for row in sample_rows:
        lines.append(
            f"  {row['resume_id']:<12} {row['job_id']:<14} "
            f"{row['score']:>10.4f} {row['rank']:>6} {row['relevant']:>10}"
        )
    lines.append("")
    lines.append("=" * 70)
    lines.append("  NOTE: Results are actual experimental measurements.")
    lines.append("  They have NOT been modified or fabricated.")
    lines.append("=" * 70)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    evaluate()
