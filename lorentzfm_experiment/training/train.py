"""
train.py
========
Milestone 3: LorentzFM Training Loop

CareerCompass AI — Research Baseline Comparison
Isolated from production pipeline. Do NOT import into CareerCompass AI.

Training protocol (identical experimental foundation as SBERT / BERT):
  - Uses ONLY training split jobs for pair construction and negative sampling
  - Validation split used ONLY for early stopping / model selection
  - Test split is NEVER touched during training
  - Random seed = 42 throughout
  - Saves: lorentzfm_best_model.pt, training_history.csv,
           training_config.json, training_log.txt

Saved artefacts
---------------
  results/lorentzfm_best_model.pt       — best checkpoint (lowest val loss)
  results/training_history.csv          — per-epoch metrics
  results/training_config.json          — full reproducibility record
  results/training_log.txt              — human-readable training log
"""

import json
import logging
import os
import random
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# ── sys.path setup ─────────────────────────────────────────────────────────────
SCRIPT_DIR     = Path(__file__).resolve().parent        # .../training/
EXPERIMENT_DIR = SCRIPT_DIR.parent                      # .../lorentzfm_experiment/
WORKSPACE_ROOT = EXPERIMENT_DIR.parent                  # .../LorrentzFM/
sys.path.insert(0, str(WORKSPACE_ROOT))

from lorentzfm_experiment.data.dataset import (
    build_resume_feature_matrix,
    build_job_feature_matrix,
    compute_relevance_matrix,
    LorentzFMPairDataset,
    RESUME_FEATURE_DIM,
    JOB_FEATURE_DIM,
)
from lorentzfm_experiment.models.lorentz_fm import (
    LorentzFM,
    BPRLoss,
    build_model,
)

# ── Force UTF-8 on Windows ─────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ── Paths ──────────────────────────────────────────────────────────────────────
CONFIG_PATH  = EXPERIMENT_DIR / "configs" / "experiment_config.json"
RESULTS_DIR  = EXPERIMENT_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)

BEST_MODEL_PATH   = RESULTS_DIR / "lorentzfm_best_model.pt"
HISTORY_CSV_PATH  = RESULTS_DIR / "training_history.csv"
TRAIN_CFG_PATH    = RESULTS_DIR / "training_config.json"
TRAIN_LOG_PATH    = RESULTS_DIR / "training_log.txt"


# ══════════════════════════════════════════════════════════════════════════════
# Reproducibility
# ══════════════════════════════════════════════════════════════════════════════

def set_seeds(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark     = False
    os.environ["PYTHONHASHSEED"] = str(seed)


# ══════════════════════════════════════════════════════════════════════════════
# Logging (console + file)
# ══════════════════════════════════════════════════════════════════════════════

def setup_logging(log_path: Path) -> logging.Logger:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("lorentzfm_train")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    fmt = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s",
                            datefmt="%Y-%m-%d %H:%M:%S")

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # File handler
    fh = logging.FileHandler(log_path, mode="w", encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger


# ══════════════════════════════════════════════════════════════════════════════
# Validation loss (BPR on val-split positive pairs + random negatives)
# ══════════════════════════════════════════════════════════════════════════════

def compute_val_loss(
    model:            LorentzFM,
    loss_fn:          BPRLoss,
    resume_feat_mat:  np.ndarray,
    job_feat_mat:     np.ndarray,
    val_job_indices:  np.ndarray,      # indices into job_feat_mat for val jobs
    resume_domain_mat: np.ndarray,     # (N, 15)
    job_domain_mat:    np.ndarray,     # (M, 15)
    training_pairs_df: pd.DataFrame,
    resume_id_to_idx:  Dict[int, int],
    job_id_to_idx:     Dict[int, int],
    device:            torch.device,
    rng:               np.random.Generator,
    batch_size:        int = 512,
) -> float:
    """
    Compute BPR loss over all positive (resume, val_job) pairs.
    Negatives are sampled from the val split.
    Val split is used for loss measurement only — NOT for tuning hyperparameters.
    """
    model.eval()

    # Build val pairs: resume × val_job where job is relevant
    val_job_id_set = set(
        int(jid) for idx in val_job_indices
        for jid in [list(job_id_to_idx.keys())[list(job_id_to_idx.values()).index(idx)]]
        if idx in job_id_to_idx.values()
    )

    # More efficient: reverse lookup via array
    idx_to_job_id = {v: k for k, v in job_id_to_idx.items()}
    val_job_ids   = np.array([idx_to_job_id[i] for i in val_job_indices
                              if i in idx_to_job_id], dtype=np.int64)

    # For each resume, find relevant val jobs
    val_pairs = []
    for r_id, r_idx in resume_id_to_idx.items():
        r_dom = resume_domain_mat[r_idx]
        for j_id in val_job_ids:
            if j_id not in job_id_to_idx:
                continue
            j_idx = job_id_to_idx[j_id]
            j_dom = job_domain_mat[j_idx]
            if np.dot(r_dom, j_dom) > 0:
                val_pairs.append((r_idx, j_idx))

    if not val_pairs:
        return float("inf")

    val_pairs = np.array(val_pairs)
    total_loss = 0.0
    n_batches  = 0

    with torch.no_grad():
        for start in range(0, len(val_pairs), batch_size):
            batch = val_pairs[start: start + batch_size]
            r_indices   = batch[:, 0]
            pos_indices = batch[:, 1]

            # Sample negatives from val pool
            neg_indices = rng.choice(val_job_indices, size=len(batch))

            r_feat   = torch.from_numpy(resume_feat_mat[r_indices]).to(device)
            pos_feat = torch.from_numpy(job_feat_mat[pos_indices]).to(device)
            neg_feat = torch.from_numpy(job_feat_mat[neg_indices]).to(device)

            s_pos = model(r_feat, pos_feat)
            s_neg = model(r_feat, neg_feat)
            loss  = loss_fn(s_pos, s_neg, model=None)

            total_loss += loss.item()
            n_batches  += 1

    return total_loss / max(n_batches, 1)


# ══════════════════════════════════════════════════════════════════════════════
# Main training function
# ══════════════════════════════════════════════════════════════════════════════

def train():
    # ── Load config ────────────────────────────────────────────────────────────
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    logger = setup_logging(TRAIN_LOG_PATH)

    logger.info("=" * 70)
    logger.info("  LorentzFM Training  —  Milestone 3")
    logger.info("  CareerCompass AI Research Baseline Comparison")
    logger.info("=" * 70)

    # ── Reproducibility ────────────────────────────────────────────────────────
    SEED = config["random_seed"]
    set_seeds(SEED)
    logger.info("Random seed: %d", SEED)

    # ── Device ─────────────────────────────────────────────────────────────────
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("Device: %s", device)

    # ── Training hyperparameters ───────────────────────────────────────────────
    t_cfg       = config["training"]
    EPOCHS      = t_cfg["num_epochs"]                  # 50
    BATCH_SIZE  = t_cfg["batch_size"]                  # 256
    LR          = t_cfg["learning_rate"]               # 0.001
    WD          = t_cfg["weight_decay"]                # 1e-5
    PATIENCE    = 10   # increased for stable convergence
    NUM_NEG     = t_cfg["negative_sampling"]["num_negatives_per_positive"]  # 4
    GRAD_CLIP   = t_cfg["gradient_clip_norm"]          # 1.0
    EMBED_DIM   = config["model"]["embedding_dim"]     # 32

    logger.info("Hyperparameters:")
    logger.info("  epochs=%d  batch_size=%d  lr=%.4f  weight_decay=%.2e",
                EPOCHS, BATCH_SIZE, LR, WD)
    logger.info("  embed_dim=%d  num_negatives=%d  early_stopping_patience=%d",
                EMBED_DIM, NUM_NEG, PATIENCE)
    logger.info("  grad_clip=%.1f  seed=%d", GRAD_CLIP, SEED)

    # ── Load feature matrices ─────────────────────────────────────────────────
    ds_cfg = config["dataset"]

    logger.info("\nLoading resume feature matrix...")
    t0 = time.time()
    resume_ids, resume_feat_mat = build_resume_feature_matrix(
        resumes_path       = Path(ds_cfg["resumes"]["path"]),
        resume_domain_path = Path(ds_cfg["resumes"]["domain_label_path"]),
    )
    logger.info("  Resumes: %s  (%.2f s)", resume_feat_mat.shape, time.time() - t0)

    logger.info("Loading job feature matrix...")
    t0 = time.time()
    job_ids, job_feat_mat = build_job_feature_matrix(
        domain_labels_path  = Path(ds_cfg["jobs"]["domain_label_path"]),
        split_manifest_path = Path(ds_cfg["split"]["manifest_path"]),
        job_skills_path     = Path(ds_cfg["jobs"]["job_skills_path"]),
        skills_mapping_path = Path(ds_cfg["jobs"]["skills_mapping_path"]),
        faiss_id_map_path   = Path(ds_cfg["jobs"]["faiss_id_map_path"]),
    )
    logger.info("  Jobs: %s  (%.2f s)", job_feat_mat.shape, time.time() - t0)

    resume_id_to_idx = {int(rid): i for i, rid in enumerate(resume_ids)}
    job_id_to_idx    = {int(jid): i for i, jid in enumerate(job_ids)}

    resume_domain_mat = resume_feat_mat[:, :15]
    job_domain_mat    = job_feat_mat[:, :15]

    # ── Split indices ──────────────────────────────────────────────────────────
    manifest_df = pd.read_csv(
        Path(ds_cfg["split"]["manifest_path"]),
        usecols=["job_id", "split"]
    )
    train_job_ids = set(manifest_df[manifest_df["split"] == "train"]["job_id"].tolist())
    val_job_ids   = set(manifest_df[manifest_df["split"] == "val"]["job_id"].tolist())

    train_job_indices = np.array(
        [job_id_to_idx[jid] for jid in train_job_ids if jid in job_id_to_idx],
        dtype=np.int64,
    )
    val_job_indices = np.array(
        [job_id_to_idx[jid] for jid in val_job_ids if jid in job_id_to_idx],
        dtype=np.int64,
    )

    logger.info("Train job indices: %d  |  Val job indices: %d",
                len(train_job_indices), len(val_job_indices))

    # ── Build training dataset ─────────────────────────────────────────────────
    logger.info("\nBuilding training pair dataset...")
    train_dataset = LorentzFMPairDataset(
        training_pairs_path = Path(ds_cfg["training_pairs"]["path"]),
        resume_ids          = resume_ids,
        resume_feat_mat     = resume_feat_mat,
        job_ids             = job_ids,
        job_feat_mat        = job_feat_mat,
        split_manifest_path = Path(ds_cfg["split"]["manifest_path"]),
        split               = "train",
        num_negatives       = NUM_NEG,
        random_seed         = SEED,
    )
    logger.info("  Training samples: %d  (pairs × negatives)", len(train_dataset))

    train_loader = DataLoader(
        train_dataset,
        batch_size  = BATCH_SIZE,
        shuffle     = True,
        num_workers = 0,
        pin_memory  = False,
        drop_last   = False,
    )
    logger.info("  Batches per epoch: %d", len(train_loader))

    # ── Validation: P@10 on a small sample of resumes vs val jobs ─────────────
    # Use ranking quality (P@10) as early-stopping signal instead of BPR loss,
    # which suffers from scale mismatch between train and val negative pools.
    logger.info("Building validation evaluation sample...")
    t0 = time.time()

    idx_to_job_id  = {v: k for k, v in job_id_to_idx.items()}
    val_job_id_arr = np.array(
        [idx_to_job_id[i] for i in val_job_indices if i in idx_to_job_id],
        dtype=np.int64,
    )
    val_job_feat = job_feat_mat[val_job_indices]   # (|val|, 53)

    # Precompute relevance for all resumes vs all val jobs (small: 228 × 7491)
    val_relevance = compute_relevance_matrix(
        resume_domain_mat,            # (228, 15)
        job_feat_mat[val_job_indices, :15],  # (7491, 15)
    )   # (228, 7491)

    # Use all 228 resumes for val scoring (fast: 228 × 7491)
    val_resume_feat = torch.from_numpy(resume_feat_mat)    # (228, 19)
    val_job_feat_t  = torch.from_numpy(val_job_feat)       # (7491, 53)

    logger.info("  Val jobs: %d  |  Val relevance matrix: %s  (%.2f s)",
                len(val_job_indices), val_relevance.shape, time.time() - t0)

    def fast_val_loss() -> float:
        """
        Compute mean Precision@10 over all resumes on the val job pool.
        Higher P@10 = better model. We negate it so 'lower = better' for
        consistent early-stopping logic (saves model with highest P@10).
        """
        model.eval()
        TOP_K = 10
        precisions = []
        with torch.no_grad():
            # Score all resumes vs all val jobs in one pass (228 × 7491 = 1.7M)
            # Do it resume-by-resume with batch_size jobs to stay memory-safe
            for r_idx in range(len(resume_feat_mat)):
                r_feat_t = val_resume_feat[r_idx].unsqueeze(0)   # (1, 19)
                scores   = model.score_resume_vs_all_jobs(
                    r_feat_t, val_job_feat_t, batch_size=1024, device=device
                )
                top_k_idx = np.argsort(-scores)[:TOP_K]
                hits = val_relevance[r_idx, top_k_idx].sum()
                precisions.append(hits / TOP_K)
        mean_p10 = float(np.mean(precisions))
        # Return negative P@10 so that "lower = better" for early stopping
        return -mean_p10

    # ── Model & optimiser ──────────────────────────────────────────────────────
    model, loss_fn = build_model(config)
    model = model.to(device)

    total_params     = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info("\nModel: LorentzFM  |  embed_dim=%d  |  lorentz_dim=%d",
                EMBED_DIM, EMBED_DIM + 1)
    logger.info("Parameters: total=%d  trainable=%d", total_params, trainable_params)

    optimizer = torch.optim.Adam(
        model.parameters(), lr=LR, weight_decay=0.0   # L2 handled in BPRLoss
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5, min_lr=1e-5
    )

    # ── Training loop ──────────────────────────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("  Starting Training")
    logger.info("=" * 70)

    history: List[Dict] = []
    best_val_loss  = float("inf")
    best_epoch     = 0
    patience_count = 0
    train_start    = time.time()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        epoch_loss  = 0.0
        n_batches   = 0
        epoch_start = time.time()

        for batch in train_loader:
            r_feat    = batch["resume_feat"].to(device)
            pos_feat  = batch["pos_job_feat"].to(device)
            neg_feat  = batch["neg_job_feat"].to(device)

            score_pos = model(r_feat, pos_feat)
            score_neg = model(r_feat, neg_feat)
            loss      = loss_fn(score_pos, score_neg, model=model)

            optimizer.zero_grad()
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)

            optimizer.step()

            epoch_loss += loss.item()
            n_batches  += 1

        avg_train_loss = epoch_loss / max(n_batches, 1)

        # ── Validation ─────────────────────────────────────────────────────────
        val_metric = fast_val_loss()   # negative P@10; lower = better
        val_p10    = -val_metric        # actual P@10 for logging
        scheduler.step(val_metric)

        current_lr   = optimizer.param_groups[0]["lr"]
        epoch_time   = time.time() - epoch_start
        elapsed_total = time.time() - train_start

        logger.info(
            "Epoch %3d/%d | train_loss=%.6f | val_P@10=%.4f | lr=%.6f | "
            "epoch_time=%.1fs | total_elapsed=%.1fs",
            epoch, EPOCHS, avg_train_loss, val_p10, current_lr,
            epoch_time, elapsed_total,
        )

        # ── Record history ──────────────────────────────────────────────────────
        history.append({
            "epoch":           epoch,
            "train_loss":      round(avg_train_loss, 6),
            "val_P@10":        round(val_p10,        4),
            "val_metric":      round(val_metric,     6),   # negative P@10
            "learning_rate":   current_lr,
            "epoch_time_s":    round(epoch_time,     2),
            "elapsed_total_s": round(elapsed_total,  2),
        })

        # ── Model selection (save best) ─────────────────────────────────────────
        if val_metric < best_val_loss:
            best_val_loss  = val_metric
            best_epoch     = epoch
            patience_count = 0
            torch.save({
                "epoch":       epoch,
                "model_state": model.state_dict(),
                "optim_state": optimizer.state_dict(),
                "val_metric":  val_metric,
                "val_p10":     val_p10,
                "train_loss":  avg_train_loss,
                "config":      config,
            }, BEST_MODEL_PATH)
            logger.info("  --> Best model saved  (val_P@10=%.4f, epoch=%d)",
                        val_p10, best_epoch)
        else:
            patience_count += 1
            logger.info("  No improvement. Patience %d/%d", patience_count, PATIENCE)

        # ── Early stopping ──────────────────────────────────────────────────────
        if patience_count >= PATIENCE:
            logger.info("\nEarly stopping triggered at epoch %d. "
                        "Best epoch=%d  best_val_loss=%.6f",
                        epoch, best_epoch, best_val_loss)
            break

    total_training_time = time.time() - train_start

    # ── Save training history ──────────────────────────────────────────────────
    history_df = pd.DataFrame(history)
    history_df.to_csv(HISTORY_CSV_PATH, index=False)
    logger.info("\nTraining history saved: %s", HISTORY_CSV_PATH)

    # ── Save training config (reproducibility record) ──────────────────────────
    train_config_record = {
        "experiment_name":    config["experiment_name"],
        "random_seed":        SEED,
        "numpy_seed":         SEED,
        "torch_seed":         SEED,
        "model": {
            "architecture":   "LorentzFM",
            "embedding_dim":  EMBED_DIM,
            "lorentz_dim":    EMBED_DIM + 1,
            "curvature":      config["model"]["lorentz_curvature"],
            "num_resume_fields": 5,
            "num_job_fields":    5,
            "total_params":   total_params,
            "trainable_params": trainable_params,
        },
        "dataset": {
            "num_resumes":       int(len(resume_ids)),
            "num_jobs":          int(len(job_ids)),
            "resume_feature_dim": RESUME_FEATURE_DIM,
            "job_feature_dim":   JOB_FEATURE_DIM,
            "train_jobs":        int(len(train_job_indices)),
            "val_jobs":          int(len(val_job_indices)),
            "val_positive_pairs": int(val_relevance.sum()),
            "training_samples":  len(train_dataset),
        },
        "training": {
            "epochs_configured": EPOCHS,
            "best_epoch":        best_epoch,
            "epochs_run":        len(history),
            "batch_size":        BATCH_SIZE,
            "learning_rate":     LR,
            "weight_decay":      WD,
            "optimizer":         "Adam",
            "lr_scheduler":      "ReduceLROnPlateau(factor=0.5, patience=3)",
            "loss_function":     "BPR (Bayesian Personalised Ranking)",
            "l2_lambda":         WD,
            "grad_clip_norm":    GRAD_CLIP,
            "early_stopping_patience": PATIENCE,
            "early_stopping_metric":   "val_loss",
            "negative_sampling": {
                "strategy":      "random in-batch from train-split only",
                "num_negatives": NUM_NEG,
                "pool_size":     int(len(train_job_indices)),
                "retry_limit":   20,
            },
        },
        "results": {
            "best_val_P@10":        round(-best_val_loss, 4),
            "best_epoch":           best_epoch,
            "total_training_time_s": round(total_training_time, 2),
            "best_model_path":      str(BEST_MODEL_PATH),
            "history_path":         str(HISTORY_CSV_PATH),
        },
        "hardware": str(device),
        "test_split_used": False,
        "note": "Test split was NOT used at any point during training or validation.",
    }

    with open(TRAIN_CFG_PATH, "w", encoding="utf-8") as f:
        json.dump(train_config_record, f, indent=2)
    logger.info("Training config saved: %s", TRAIN_CFG_PATH)

    # ── Final summary ──────────────────────────────────────────────────────────
    logger.info("")
    logger.info("=" * 70)
    logger.info("  TRAINING COMPLETE — MILESTONE 3 SUMMARY")
    logger.info("=" * 70)
    logger.info("  Best epoch          : %d / %d", best_epoch, len(history))
    logger.info("  Best val P@10       : %.4f", -best_val_loss)
    logger.info("  Final train loss    : %.6f", history[-1]["train_loss"])
    logger.info("  Total training time : %.1f s (%.2f min)",
                total_training_time, total_training_time / 60)
    logger.info("  Total parameters    : %d", total_params)
    logger.info("  Trainable parameters: %d", trainable_params)
    logger.info("  Best model saved to : %s", BEST_MODEL_PATH)
    logger.info("  History saved to    : %s", HISTORY_CSV_PATH)
    logger.info("  Config saved to     : %s", TRAIN_CFG_PATH)
    logger.info("  Log saved to        : %s", TRAIN_LOG_PATH)
    logger.info("  Test split used     : NO (preserved for Milestone 4)")
    logger.info("=" * 70)

    return train_config_record


if __name__ == "__main__":
    train()
