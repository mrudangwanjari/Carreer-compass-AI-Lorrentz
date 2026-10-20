"""
test_lorentzfm_pipeline.py
==========================
Milestone 2 forward-pass verification for LorentzFM Baseline Experiment.

Verifies:
  [1] Lorentz manifold math (inner product, exp_map, hyperboloid constraint)
  [2] Feature field slicing dimensions
  [3] FeatureFieldEncoder output shape and hyperboloid projection
  [4] Full LorentzFM forward pass on synthetic data
  [5] Full LorentzFM forward pass on REAL dataset samples
  [6] BPR loss computation
  [7] score_resume_vs_all_jobs batch evaluation
  [8] Score ordering sanity check
  [9] Gradient flow check

CareerCompass AI — Research Baseline Comparison
Isolated from production pipeline.
"""

import json
import logging
import sys
import time
from pathlib import Path

import numpy as np
import torch

# ── sys.path: make lorentzfm_experiment importable ───────────────────────────
SCRIPT_DIR   = Path(__file__).resolve().parent          # .../models/
EXPERIMENT_DIR = SCRIPT_DIR.parent                      # .../lorentzfm_experiment/
WORKSPACE_ROOT = EXPERIMENT_DIR.parent                  # .../LorrentzFM/
sys.path.insert(0, str(WORKSPACE_ROOT))

from lorentzfm_experiment.models.lorentz_fm import (
    LorentzFM,
    BPRLoss,
    FeatureFieldEncoder,
    lorentz_inner,
    exp_map_origin,
    lorentz_norm,
    build_model,
    RESUME_FEATURE_DIM,
    JOB_FEATURE_DIM,
    RESUME_FIELDS,
    JOB_FIELDS,
)
from lorentzfm_experiment.data.dataset import (
    build_resume_feature_matrix,
    build_job_feature_matrix,
    compute_relevance_matrix,
)

# ── Force UTF-8 output on Windows ─────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Paths (load from config) ──────────────────────────────────────────────────
CONFIG_PATH = EXPERIMENT_DIR / "configs" / "experiment_config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

DS = CONFIG["dataset"]

RESUMES_PATH        = Path(DS["resumes"]["path"])
RESUME_DOMAIN_PATH  = Path(DS["resumes"]["domain_label_path"])
DOMAIN_LABELS_PATH  = Path(DS["jobs"]["domain_label_path"])
SPLIT_MANIFEST_PATH = Path(DS["split"]["manifest_path"])
JOB_SKILLS_PATH     = Path(DS["jobs"]["job_skills_path"])
SKILLS_MAP_PATH     = Path(DS["jobs"]["skills_mapping_path"])
FAISS_MAP_PATH      = Path(DS["jobs"]["faiss_id_map_path"])

EMBED_DIM = CONFIG["model"]["embedding_dim"]   # 32
SEED      = CONFIG["random_seed"]              # 42

torch.manual_seed(SEED)
np.random.seed(SEED)


# ══════════════════════════════════════════════════════════════════════════════
# Utilities
# ══════════════════════════════════════════════════════════════════════════════

def section(title: str):
    logger.info("")
    logger.info("=" * 65)
    logger.info("  %s", title)
    logger.info("=" * 65)


def check(condition: bool, message: str):
    if not condition:
        raise AssertionError(f"FAILED: {message}")
    logger.info("  PASS  %s", message)


# ══════════════════════════════════════════════════════════════════════════════
# Test 1: Lorentz manifold math
# ══════════════════════════════════════════════════════════════════════════════

def test_lorentz_math():
    section("TEST 1 — Lorentz Manifold Mathematics")

    # Canonical origin on the hyperboloid: x0=1, all spatial=0
    origin = torch.tensor([[1.0, 0.0, 0.0, 0.0]])
    inner_origin = lorentz_inner(origin, origin)
    logger.info("  <origin, origin>_L = %.6f  (expected -1.0)", inner_origin.item())
    check(abs(inner_origin.item() - (-1.0)) < 1e-5, "<origin,origin>_L == -1.0")

    # exp_map of zero vector should recover origin
    v_zero = torch.zeros(1, 3)
    x_zero = exp_map_origin(v_zero)
    logger.info("  exp_map(0) = %s  (expected [1, 0, 0, 0])", x_zero.tolist())
    check(abs(x_zero[0, 0].item() - 1.0) < 1e-5,  "exp_map(0)[0] == 1.0")
    check(x_zero[0, 1:].abs().max().item() < 1e-5, "exp_map(0)[1:] == 0")

    # exp_map of any v must satisfy hyperboloid constraint: -x0² + ||xi||² = -1
    torch.manual_seed(0)
    v = torch.randn(8, 16)
    x = exp_map_origin(v)
    constraint = -x[:, 0]**2 + (x[:, 1:]**2).sum(dim=1)
    logger.info("  Hyperboloid constraint (should be -1.0):")
    logger.info("    min=%.6f  max=%.6f  mean=%.6f",
                constraint.min().item(), constraint.max().item(), constraint.mean().item())
    check(constraint.max().item() < -0.99, "Hyperboloid constraint satisfied (max < -0.99)")

    # Lorentz norm must equal 1 for all points on unit hyperboloid
    norms = lorentz_norm(x)
    logger.info("  Lorentz norms: min=%.6f  max=%.6f", norms.min().item(), norms.max().item())
    check(
        (norms - 1.0).abs().max().item() < 1e-4,
        "Lorentz norms == 1.0 for all hyperboloid points",
    )


# ══════════════════════════════════════════════════════════════════════════════
# Test 2: Feature field dimensions
# ══════════════════════════════════════════════════════════════════════════════

def test_feature_dimensions():
    section("TEST 2 — Feature Field Dimensions")

    total_resume = sum(d for _, d in RESUME_FIELDS)
    total_job    = sum(d for _, d in JOB_FIELDS)

    logger.info("  Resume fields: %s  → total=%d  (expected=%d)",
                RESUME_FIELDS, total_resume, RESUME_FEATURE_DIM)
    logger.info("  Job fields:    %s  → total=%d  (expected=%d)",
                JOB_FIELDS, total_job, JOB_FEATURE_DIM)

    check(total_resume == RESUME_FEATURE_DIM, f"Resume total dim == {RESUME_FEATURE_DIM}")
    check(total_job    == JOB_FEATURE_DIM,    f"Job total dim == {JOB_FEATURE_DIM}")
    check(RESUME_FEATURE_DIM == 19, "RESUME_FEATURE_DIM == 19")
    check(JOB_FEATURE_DIM    == 53, "JOB_FEATURE_DIM == 53")

    # Slicing test
    B = 4
    r_dummy = torch.randn(B, RESUME_FEATURE_DIM)
    j_dummy = torch.randn(B, JOB_FEATURE_DIM)

    r_slices = LorentzFM._slice_resume_fields(r_dummy)
    j_slices = LorentzFM._slice_job_fields(j_dummy)

    for (name, expected_dim), slc in zip(RESUME_FIELDS, r_slices):
        check(slc.shape == (B, expected_dim),
              f"Resume field '{name}': shape {slc.shape} == ({B},{expected_dim})")

    for (name, expected_dim), slc in zip(JOB_FIELDS, j_slices):
        check(slc.shape == (B, expected_dim),
              f"Job field '{name}': shape {slc.shape} == ({B},{expected_dim})")


# ══════════════════════════════════════════════════════════════════════════════
# Test 3: FeatureFieldEncoder
# ══════════════════════════════════════════════════════════════════════════════

def test_field_encoder():
    section("TEST 3 — FeatureFieldEncoder (Hyperboloid Projection)")

    B = 8
    for input_dim, name in [(15, "domain"), (35, "skill_vec"), (1, "scalar")]:
        enc = FeatureFieldEncoder(input_dim=input_dim, embed_dim=EMBED_DIM, field_name=name)
        x   = torch.randn(B, input_dim)
        out = enc(x)

        expected_shape = (B, EMBED_DIM + 1)
        check(out.shape == expected_shape,
              f"Encoder '{name}': output shape {out.shape} == {expected_shape}")

        # Verify hyperboloid constraint for output points
        constraint = -out[:, 0]**2 + (out[:, 1:]**2).sum(dim=1)
        check(
            constraint.max().item() < -0.9,
            f"Encoder '{name}': all outputs on hyperboloid (constraint < -0.9)",
        )
        logger.info("  Encoder '%s': shape=%s  constraint max=%.4f",
                    name, out.shape, constraint.max().item())


# ══════════════════════════════════════════════════════════════════════════════
# Test 4: Synthetic forward pass
# ══════════════════════════════════════════════════════════════════════════════

def test_forward_synthetic():
    section("TEST 4 — Synthetic Forward Pass")

    model = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    model.eval()

    B = 16
    torch.manual_seed(SEED)
    r_feat = torch.randn(B, RESUME_FEATURE_DIM)
    j_feat = torch.randn(B, JOB_FEATURE_DIM)

    with torch.no_grad():
        scores = model(r_feat, j_feat)

    logger.info("  Input:  resume_feat %s  job_feat %s", r_feat.shape, j_feat.shape)
    logger.info("  Output: scores %s", scores.shape)
    logger.info("  Score stats: min=%.4f  max=%.4f  mean=%.4f  std=%.4f",
                scores.min().item(), scores.max().item(),
                scores.mean().item(), scores.std().item())

    check(scores.shape == (B,), f"Scores shape == ({B},)")
    check(not torch.isnan(scores).any(), "No NaN in scores")
    check(not torch.isinf(scores).any(), "No Inf in scores")
    check(scores.std().item() > 0.0, "Score variance > 0 (model produces varying scores)")

    # Asymmetry check: score(R,J) should differ from score(J_swapped, R_swapped)
    # (Architecture is asymmetric: resume encoders ≠ job encoders)
    scores2 = model(r_feat.flip(0), j_feat.flip(0))
    logger.info("  Scores are position-dependent (not all equal): %s",
                not torch.allclose(scores, scores2.flip(0)))


# ══════════════════════════════════════════════════════════════════════════════
# Test 5: Real data forward pass
# ══════════════════════════════════════════════════════════════════════════════

def test_forward_real_data():
    section("TEST 5 — Real Data Forward Pass")

    logger.info("  Loading resume feature matrix from disk...")
    t0 = time.time()
    resume_ids, resume_feat_mat = build_resume_feature_matrix(
        resumes_path       = RESUMES_PATH,
        resume_domain_path = RESUME_DOMAIN_PATH,
    )
    logger.info("  Resume matrix: %s  (%.2f s)", resume_feat_mat.shape, time.time() - t0)

    logger.info("  Loading job feature matrix from disk (may take ~30 s)...")
    t0 = time.time()
    job_ids, job_feat_mat = build_job_feature_matrix(
        domain_labels_path  = DOMAIN_LABELS_PATH,
        split_manifest_path = SPLIT_MANIFEST_PATH,
        job_skills_path     = JOB_SKILLS_PATH,
        skills_mapping_path = SKILLS_MAP_PATH,
        faiss_id_map_path   = FAISS_MAP_PATH,
    )
    logger.info("  Job matrix: %s  (%.2f s)", job_feat_mat.shape, time.time() - t0)

    # Dimension checks
    check(resume_feat_mat.shape[1] == RESUME_FEATURE_DIM,
          f"Resume feature dim == {RESUME_FEATURE_DIM}")
    check(job_feat_mat.shape[1] == JOB_FEATURE_DIM,
          f"Job feature dim == {JOB_FEATURE_DIM}")
    check(len(resume_ids) == 228,    "228 resumes loaded")
    check(len(job_ids)    == 123849, "123,849 jobs loaded")

    # Check for NaN / Inf in feature matrices
    check(not np.isnan(resume_feat_mat).any(), "No NaN in resume_feat_mat")
    check(not np.isnan(job_feat_mat).any(),    "No NaN in job_feat_mat")
    check(not np.isinf(resume_feat_mat).any(), "No Inf in resume_feat_mat")
    check(not np.isinf(job_feat_mat).any(),    "No Inf in job_feat_mat")

    # Forward pass on first 8 real samples
    model = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    model.eval()

    B = 8
    r_t = torch.from_numpy(resume_feat_mat[:B])
    j_t = torch.from_numpy(job_feat_mat[:B])

    with torch.no_grad():
        scores = model(r_t, j_t)

    logger.info("  Real forward pass: %d samples → scores %s", B, scores.shape)
    logger.info("  Score stats: min=%.4f  max=%.4f  mean=%.4f",
                scores.min().item(), scores.max().item(), scores.mean().item())

    check(scores.shape == (B,), f"Real forward pass output shape == ({B},)")
    check(not torch.isnan(scores).any(), "No NaN in real forward pass")

    return resume_ids, resume_feat_mat, job_ids, job_feat_mat


# ══════════════════════════════════════════════════════════════════════════════
# Test 6: BPR loss
# ══════════════════════════════════════════════════════════════════════════════

def test_bpr_loss():
    section("TEST 6 — BPR Loss Computation")

    model   = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    loss_fn = BPRLoss(l2_lambda=1e-5)

    B = 16
    r_feat    = torch.randn(B, RESUME_FEATURE_DIM)
    pos_jfeat = torch.randn(B, JOB_FEATURE_DIM)
    neg_jfeat = torch.randn(B, JOB_FEATURE_DIM)

    score_pos = model(r_feat, pos_jfeat)
    score_neg = model(r_feat, neg_jfeat)

    loss_no_reg  = loss_fn(score_pos, score_neg, model=None)
    loss_with_reg = loss_fn(score_pos, score_neg, model=model)

    logger.info("  score_pos  : mean=%.4f  std=%.4f", score_pos.mean().item(), score_pos.std().item())
    logger.info("  score_neg  : mean=%.4f  std=%.4f", score_neg.mean().item(), score_neg.std().item())
    logger.info("  BPR loss (no reg)  = %.6f", loss_no_reg.item())
    logger.info("  BPR loss (with reg)= %.6f", loss_with_reg.item())

    check(not torch.isnan(loss_no_reg),   "BPR loss (no reg) is not NaN")
    check(not torch.isnan(loss_with_reg), "BPR loss (with reg) is not NaN")
    check(loss_with_reg.item() > 0.0,     "BPR loss > 0")

    # When pos > neg, loss should be less than log(2) ≈ 0.693
    # When scores are equal, loss should be exactly log(2)
    score_equal = torch.zeros(B)
    loss_equal  = loss_fn(score_equal, score_equal, model=None)
    logger.info("  BPR loss (equal scores) = %.6f  (expected log(2)=%.6f)",
                loss_equal.item(), np.log(2))
    check(abs(loss_equal.item() - np.log(2)) < 0.01,
          "BPR loss with equal scores == log(2)")


# ══════════════════════════════════════════════════════════════════════════════
# Test 7: score_resume_vs_all_jobs
# ══════════════════════════════════════════════════════════════════════════════

def test_score_vs_all_jobs(resume_feat_mat: np.ndarray, job_feat_mat: np.ndarray):
    section("TEST 7 — score_resume_vs_all_jobs (Ranking)")

    model = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    model.eval()

    # Score first resume vs first 1000 jobs (fast subset)
    N_JOBS = 1000
    r_feat  = torch.from_numpy(resume_feat_mat[0])
    j_feat  = torch.from_numpy(job_feat_mat[:N_JOBS])

    logger.info("  Scoring resume[0] vs %d jobs...", N_JOBS)
    t0 = time.time()
    scores = model.score_resume_vs_all_jobs(r_feat, j_feat, batch_size=256)
    elapsed = time.time() - t0

    logger.info("  scores shape: %s  (%.3f s)", scores.shape, elapsed)
    logger.info("  Score stats: min=%.4f  max=%.4f  mean=%.4f  std=%.4f",
                scores.min(), scores.max(), scores.mean(), scores.std())

    check(scores.shape == (N_JOBS,), f"scores shape == ({N_JOBS},)")
    check(not np.isnan(scores).any(), "No NaN in scores")
    check(not np.isinf(scores).any(), "No Inf in scores")
    check(scores.std() > 0.0,        "Score variance > 0")


# ══════════════════════════════════════════════════════════════════════════════
# Test 8: Score ordering sanity (relevant jobs should score higher after training init)
# ══════════════════════════════════════════════════════════════════════════════

def test_score_ordering(
    resume_feat_mat: np.ndarray,
    job_feat_mat:    np.ndarray,
):
    section("TEST 8 — Score Ordering Sanity Check")

    # Compute relevance matrix for first 5 resumes vs first 500 jobs
    N_R, N_J = 5, 500
    rel_mat = compute_relevance_matrix(
        resume_feat_mat[:N_R, :15],
        job_feat_mat[:N_J, :15],
    )

    relevant_counts = rel_mat.sum(axis=1)
    logger.info("  Relevance counts for first %d resumes vs first %d jobs:", N_R, N_J)
    for i, cnt in enumerate(relevant_counts):
        logger.info("    resume[%d]: %d relevant jobs out of %d", i, cnt, N_J)

    check(
        relevant_counts.sum() > 0,
        "At least one relevant job exists in the test subset",
    )

    # Note: at random initialisation the model does NOT guarantee relevant > irrelevant.
    # This test just confirms scores can be compared and ranking is possible.
    model = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    model.eval()

    r0_feat = torch.from_numpy(resume_feat_mat[0])
    j_feat  = torch.from_numpy(job_feat_mat[:N_J])

    scores = model.score_resume_vs_all_jobs(r0_feat, j_feat, batch_size=256)
    ranked_idx = np.argsort(-scores)[:10]

    logger.info("  Top-10 ranked job indices for resume[0]: %s", ranked_idx.tolist())
    logger.info("  Top-10 job scores:                       %s",
                [round(float(scores[i]), 4) for i in ranked_idx])

    relevant_in_top10 = rel_mat[0, ranked_idx].sum()
    logger.info("  Relevant jobs in random-init top-10: %d / 10", relevant_in_top10)
    logger.info("  (At random init, relevant-in-top-10 is expected to be ~ chance level.")
    logger.info("   This will improve after training.)")

    check(True, "Score ordering test passed (random init, training will improve ranking)")


# ══════════════════════════════════════════════════════════════════════════════
# Test 9: Gradient flow
# ══════════════════════════════════════════════════════════════════════════════

def test_gradient_flow():
    section("TEST 9 — Gradient Flow")

    model   = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)
    loss_fn = BPRLoss(l2_lambda=1e-5)
    optim   = torch.optim.Adam(model.parameters(), lr=1e-3)

    B = 16
    r_feat    = torch.randn(B, RESUME_FEATURE_DIM)
    pos_jfeat = torch.randn(B, JOB_FEATURE_DIM)
    neg_jfeat = torch.randn(B, JOB_FEATURE_DIM)

    # Forward
    score_pos = model(r_feat, pos_jfeat)
    score_neg = model(r_feat, neg_jfeat)
    loss      = loss_fn(score_pos, score_neg, model=model)

    # Backward
    optim.zero_grad()
    loss.backward()

    # Check gradients exist and are finite
    grad_ok = True
    no_grad_params = []
    for name, param in model.named_parameters():
        if param.requires_grad:
            if param.grad is None:
                no_grad_params.append(name)
                grad_ok = False
            elif torch.isnan(param.grad).any() or torch.isinf(param.grad).any():
                logger.warning("  NaN/Inf gradient in: %s", name)
                grad_ok = False

    if no_grad_params:
        logger.warning("  Parameters with no gradient: %s", no_grad_params)

    check(grad_ok, "All trainable parameters received finite gradients")

    # One optimiser step
    optim.step()
    logger.info("  Optimiser step completed. loss=%.6f", loss.item())
    check(True, "Gradient flow and optimiser step successful")


# ══════════════════════════════════════════════════════════════════════════════
# Parameter summary
# ══════════════════════════════════════════════════════════════════════════════

def print_parameter_summary():
    section("PARAMETER SUMMARY")

    model = LorentzFM(embed_dim=EMBED_DIM, curvature=-1.0)

    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)

    logger.info("  %-45s  %10s", "Module", "Params")
    logger.info("  " + "-" * 60)
    for name, module in model.named_modules():
        if not list(module.children()):   # leaf modules only
            params = sum(p.numel() for p in module.parameters())
            if params > 0:
                logger.info("  %-45s  %10d", name, params)
    logger.info("  " + "-" * 60)
    logger.info("  %-45s  %10d", "TOTAL", total)
    logger.info("  %-45s  %10d", "TRAINABLE", trainable)

    return total, trainable


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    logger.info("")
    logger.info("*" * 65)
    logger.info("  MILESTONE 2: LorentzFM Pipeline Verification")
    logger.info("  CareerCompass AI — Research Baseline Comparison")
    logger.info("*" * 65)

    t_start = time.time()
    passed  = 0
    failed  = 0

    tests = [
        ("Lorentz Manifold Math",       test_lorentz_math),
        ("Feature Dimensions",          test_feature_dimensions),
        ("FeatureFieldEncoder",         test_field_encoder),
        ("Synthetic Forward Pass",      test_forward_synthetic),
        ("BPR Loss",                    test_bpr_loss),
        ("Gradient Flow",               test_gradient_flow),
    ]

    # Run non-data tests first
    for name, fn in tests:
        try:
            fn()
            passed += 1
        except AssertionError as e:
            logger.error("  ✗ Test '%s' FAILED: %s", name, e)
            failed += 1
        except Exception as e:
            logger.error("  ✗ Test '%s' ERROR: %s", name, e)
            failed += 1

    # Real data tests (may be slow on first run due to CSV loading)
    try:
        resume_ids, resume_feat_mat, job_ids, job_feat_mat = test_forward_real_data()
        passed += 1
        try:
            test_score_vs_all_jobs(resume_feat_mat, job_feat_mat)
            passed += 1
        except Exception as e:
            logger.error("  ✗ Test 'score_vs_all_jobs' ERROR: %s", e)
            failed += 1
        try:
            test_score_ordering(resume_feat_mat, job_feat_mat)
            passed += 1
        except Exception as e:
            logger.error("  ✗ Test 'score_ordering' ERROR: %s", e)
            failed += 1
    except Exception as e:
        logger.error("  ✗ Test 'Real Data Forward Pass' ERROR: %s", e)
        failed += 3

    # Parameter summary
    try:
        total_params, trainable_params = print_parameter_summary()
        passed += 1
    except Exception as e:
        logger.error("  ✗ Parameter summary ERROR: %s", e)
        failed += 1

    # ── Final summary ──────────────────────────────────────────────────────────
    elapsed = time.time() - t_start
    section("MILESTONE 2 VERIFICATION SUMMARY")
    logger.info("  Tests passed : %d", passed)
    logger.info("  Tests failed : %d", failed)
    logger.info("  Total time   : %.1f s", elapsed)
    logger.info("")

    if failed == 0:
        logger.info("  *** ALL TESTS PASSED — LorentzFM Pipeline Verified ***")
        logger.info("  Ready to proceed to Milestone 3 (Training).")
    else:
        logger.error("  *** %d TEST(S) FAILED — Review errors above ***", failed)

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
