"""
lorentz_fm.py
=============
LorentzFM Baseline Model for Resume-to-Job Recommendation.

CareerCompass AI — Research Baseline Comparison
Isolated from production pipeline. Do NOT import into CareerCompass AI.

Architecture Overview
---------------------

  Resume Features (19-dim)          Job Features (53-dim)
       ↓                                    ↓
  Feature Field Split                Feature Field Split
  (5 fields × embed_dim)            (5 fields × embed_dim)
       ↓                                    ↓
  Linear Projection → Lorentz        Linear Projection → Lorentz
  Hyperboloid Mapping                Hyperboloid Mapping
  (exp_map: x0 = sqrt(1 + ||x||²))   (exp_map: x0 = sqrt(1 + ||x||²))
       ↓                                    ↓
  Lorentz Feature Embeddings         Lorentz Feature Embeddings
       ↓_____________________________↓
              Cross-field Lorentz Inner Product
              Σ  -< e_i^R, e_j^J >_L   (all i,j pairs)
                         ↓
              Resume–Job Compatibility Score
                         ↓
                    Job Ranking

Mathematical Foundation
-----------------------
Lorentz (Hyperboloid) Model of hyperbolic space H^n_c (curvature c < 0):
  Hyperboloid: { x ∈ R^{n+1} : <x,x>_L = 1/c, x0 > 0 }
  where <x,y>_L = -x0*y0 + x1*y1 + ... + xn*yn  (Minkowski inner product)

For c = -1:
  Hyperboloid: { x : -x0² + Σxi² = -1 }
  Given a spatial vector v ∈ R^n, the exponential map at origin gives:
    x = (sqrt(1 + ||v||²), v)   ← points on the hyperboloid

LorentzFM Interaction (from "Lorentzian Factorization Machine", Xu et al. 2021):
  score = Σ_{i≠j} -<e_i, e_j>_L
        = Σ_{i≠j} (e_i_0 * e_j_0 - dot(e_i_spatial, e_j_spatial))

Loss Function:
  BPR (Bayesian Personalised Ranking) pairwise loss:
    L = -log(sigmoid(score_pos - score_neg))
  with L2 regularisation on spatial embedding weights.

References
----------
  Xu et al., "Lorentzian Factorization Machine" (AAAI 2021)
  Nickel & Kiela, "Learning Continuous Hierarchies in the Lorentz Model" (ICML 2018)
"""

import logging
import math
from typing import Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ── Feature field dimensions ──────────────────────────────────────────────────
# Resume fields (5 fields, total input dim = 19)
RESUME_FIELDS = [
    ("domain",     15),   # domain vector
    ("skill_cnt",   1),   # skill_count
    ("seniority",   1),   # seniority_level
    ("edu_score",   1),   # education_score
    ("cert_cnt",    1),   # cert_count
]

# Job fields (5 fields, total input dim = 53)
JOB_FIELDS = [
    ("domain",      15),  # domain vector
    ("skill_vec",   35),  # 35-dim skill code multi-hot
    ("exp_level",    1),  # experience_level
    ("has_salary",   1),  # has_salary
    ("dom_count",    1),  # domain_count
]

RESUME_FEATURE_DIM = sum(d for _, d in RESUME_FIELDS)   # 19
JOB_FEATURE_DIM    = sum(d for _, d in JOB_FIELDS)      # 53


# ══════════════════════════════════════════════════════════════════════════════
# Lorentz Manifold Operations
# ══════════════════════════════════════════════════════════════════════════════

def lorentz_inner(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """
    Minkowski / Lorentz inner product:
      <x, y>_L = -x0*y0 + Σ xi*yi   (i = 1..n)

    Input shapes: (..., n+1)  where dim 0 is the time-like coordinate.
    Output shape: (...,)
    """
    # Split time-like (index 0) and space-like (index 1:) components
    x0 = x[..., :1]   # (..., 1)
    xi = x[..., 1:]   # (..., n)
    y0 = y[..., :1]
    yi = y[..., 1:]
    return (-x0 * y0 + (xi * yi).sum(dim=-1, keepdim=True)).squeeze(-1)   # (...,)


def exp_map_origin(v: torch.Tensor, eps: float = 1e-8) -> torch.Tensor:
    """
    Exponential map at the Lorentz origin o = (1, 0, ..., 0):
      Given spatial vector v ∈ R^n,
      x = (sqrt(1 + ||v||²), v)

    This places v onto the hyperboloid H^n_{c=-1}.

    Input:  (..., n)
    Output: (..., n+1)   — full Lorentz point with time-like coordinate prepended
    """
    v_norm_sq = (v * v).sum(dim=-1, keepdim=True).clamp(min=0.0)   # (..., 1)
    x0 = torch.sqrt(1.0 + v_norm_sq + eps)                          # (..., 1)
    return torch.cat([x0, v], dim=-1)                                # (..., n+1)


def lorentz_norm(x: torch.Tensor, eps: float = 1e-8) -> torch.Tensor:
    """
    Lorentz norm of a point on the hyperboloid: sqrt(-<x,x>_L).
    Should equal 1.0 for unit-curvature hyperboloid.
    """
    inner = lorentz_inner(x, x)
    return torch.sqrt((-inner).clamp(min=eps))


# ══════════════════════════════════════════════════════════════════════════════
# FeatureFieldEncoder
# ══════════════════════════════════════════════════════════════════════════════

class FeatureFieldEncoder(nn.Module):
    """
    Encodes one feature field (raw input slice of dimension `input_dim`)
    into a spatial embedding of dimension `embed_dim`, then maps it onto
    the Lorentz hyperboloid via exp_map_origin.

    Output: a Lorentz point of shape (..., embed_dim + 1).
    """

    def __init__(self, input_dim: int, embed_dim: int, field_name: str = ""):
        super().__init__()
        self.field_name = field_name
        self.input_dim  = input_dim
        self.embed_dim  = embed_dim

        # Linear projection: input_dim → embed_dim
        self.proj = nn.Linear(input_dim, embed_dim, bias=True)
        # Layer norm on the spatial embedding before mapping to hyperboloid
        self.ln   = nn.LayerNorm(embed_dim)

        self._init_weights()

    def _init_weights(self):
        nn.init.xavier_uniform_(self.proj.weight)
        nn.init.zeros_(self.proj.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: (..., input_dim)  → Lorentz point (..., embed_dim + 1)
        """
        spatial = self.ln(self.proj(x))           # (..., embed_dim)
        # Small scale to keep spatial norm small → stable hyperboloid mapping
        spatial = spatial * 0.1
        lorentz_pt = exp_map_origin(spatial)       # (..., embed_dim + 1)
        return lorentz_pt


# ══════════════════════════════════════════════════════════════════════════════
# LorentzFM
# ══════════════════════════════════════════════════════════════════════════════

class LorentzFM(nn.Module):
    """
    LorentzFM Baseline for Resume-to-Job Recommendation.

    Each feature field (resume or job) is independently projected into
    Lorentz / hyperbolic space. The compatibility score is the sum of
    Lorentz inner products across all cross-field pairs (resume × job).

    Parameters
    ----------
    embed_dim : int
        Spatial embedding dimension (default 32).
        Each Lorentz point has dimension embed_dim + 1.
    curvature : float
        Hyperbolic curvature (default -1.0).
        Note: only magnitude matters; sign convention absorbed in formulas.
    dropout_prob : float
        Dropout applied to spatial embeddings before manifold mapping.
    """

    def __init__(
        self,
        embed_dim:    int   = 32,
        curvature:    float = -1.0,
        dropout_prob: float = 0.1,
    ):
        super().__init__()
        self.embed_dim    = embed_dim
        self.curvature    = curvature
        self.lorentz_dim  = embed_dim + 1   # spatial + time-like

        logger.info(
            "Initialising LorentzFM | embed_dim=%d | lorentz_dim=%d | curvature=%.1f",
            embed_dim, self.lorentz_dim, curvature,
        )

        # ── Resume field encoders ──────────────────────────────────────────────
        self.resume_encoders = nn.ModuleList([
            FeatureFieldEncoder(in_dim, embed_dim, name)
            for name, in_dim in RESUME_FIELDS
        ])

        # ── Job field encoders ─────────────────────────────────────────────────
        self.job_encoders = nn.ModuleList([
            FeatureFieldEncoder(in_dim, embed_dim, name)
            for name, in_dim in JOB_FIELDS
        ])

        self.dropout = nn.Dropout(p=dropout_prob)

        # Learnable global bias (scalar score offset)
        self.bias = nn.Parameter(torch.zeros(1))

        self._log_param_count()

    def _log_param_count(self):
        total     = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        logger.info("LorentzFM parameters: total=%d  trainable=%d", total, trainable)

    # ── Feature slicing ────────────────────────────────────────────────────────

    @staticmethod
    def _slice_resume_fields(resume_feat: torch.Tensor) -> list:
        """Split (B, 19) into 5 field tensors per RESUME_FIELDS spec."""
        return [
            resume_feat[:, :15],        # domain        (15)
            resume_feat[:, 15:16],      # skill_count   (1)
            resume_feat[:, 16:17],      # seniority     (1)
            resume_feat[:, 17:18],      # edu_score     (1)
            resume_feat[:, 18:19],      # cert_count    (1)
        ]

    @staticmethod
    def _slice_job_fields(job_feat: torch.Tensor) -> list:
        """Split (B, 53) into 5 field tensors per JOB_FIELDS spec."""
        return [
            job_feat[:, :15],           # domain        (15)
            job_feat[:, 15:50],         # skill_vec     (35)
            job_feat[:, 50:51],         # exp_level     (1)
            job_feat[:, 51:52],         # has_salary    (1)
            job_feat[:, 52:53],         # dom_count     (1)
        ]

    # ── Encode to Lorentz points ───────────────────────────────────────────────

    def encode_resume(self, resume_feat: torch.Tensor) -> torch.Tensor:
        """
        (B, 19) → (B, n_resume_fields, lorentz_dim)
        """
        fields = self._slice_resume_fields(resume_feat)
        lorentz_pts = []
        for encoder, field_x in zip(self.resume_encoders, fields):
            # Apply dropout to raw field before encoding
            lpt = encoder(self.dropout(field_x))   # (B, lorentz_dim)
            lorentz_pts.append(lpt.unsqueeze(1))   # (B, 1, lorentz_dim)
        return torch.cat(lorentz_pts, dim=1)        # (B, 5, lorentz_dim)

    def encode_job(self, job_feat: torch.Tensor) -> torch.Tensor:
        """
        (B, 53) → (B, n_job_fields, lorentz_dim)
        """
        fields = self._slice_job_fields(job_feat)
        lorentz_pts = []
        for encoder, field_x in zip(self.job_encoders, fields):
            lpt = encoder(self.dropout(field_x))    # (B, lorentz_dim)
            lorentz_pts.append(lpt.unsqueeze(1))    # (B, 1, lorentz_dim)
        return torch.cat(lorentz_pts, dim=1)         # (B, 5, lorentz_dim)

    # ── Interaction score ──────────────────────────────────────────────────────

    def interaction_score(
        self,
        resume_lorentz: torch.Tensor,   # (B, n_r, lorentz_dim)
        job_lorentz:    torch.Tensor,   # (B, n_j, lorentz_dim)
    ) -> torch.Tensor:
        """
        Compute LorentzFM cross-field interaction score.

        For each batch item, compute the sum of Lorentz inner products
        between all resume field embeddings and all job field embeddings:

            score = Σ_i Σ_j  -<e_i^R, e_j^J>_L

        The negation is because the Lorentz inner product is negative
        for points on the hyperboloid; negating gives a positive score
        that increases when embeddings are geometrically close.

        Returns: (B,) score tensor
        """
        B  = resume_lorentz.shape[0]
        nr = resume_lorentz.shape[1]   # 5
        nj = job_lorentz.shape[1]      # 5

        # Expand for broadcasting: (B, nr, 1, D) and (B, 1, nj, D)
        r_exp = resume_lorentz.unsqueeze(2)   # (B, nr, 1,  lorentz_dim)
        j_exp = job_lorentz.unsqueeze(1)      # (B,  1, nj, lorentz_dim)

        # Lorentz inner product for every (i,j) pair
        # r_exp - j_exp broadcasts to (B, nr, nj, lorentz_dim)
        r_time = r_exp[..., :1]    # (B, nr, 1,  1)
        j_time = j_exp[..., :1]    # (B,  1, nj, 1)
        r_spat = r_exp[..., 1:]    # (B, nr, 1,  embed_dim)
        j_spat = j_exp[..., 1:]    # (B,  1, nj, embed_dim)

        # <r, j>_L = -r0*j0 + Σ ri*ji
        linner = -r_time * j_time + (r_spat * j_spat).sum(dim=-1, keepdim=True)
        # linner: (B, nr, nj, 1)

        # Negate: higher score = more compatible
        cross_scores = -linner.squeeze(-1)    # (B, nr, nj)

        # Sum over all cross pairs
        score = cross_scores.sum(dim=[1, 2])  # (B,)

        return score + self.bias

    # ── Forward pass ──────────────────────────────────────────────────────────

    def forward(
        self,
        resume_feat: torch.Tensor,     # (B, 19)
        job_feat:    torch.Tensor,     # (B, 53)
    ) -> torch.Tensor:
        """
        Returns compatibility score (B,) for each (resume, job) pair.
        Higher score = more compatible = higher rank.
        """
        resume_lorentz = self.encode_resume(resume_feat)   # (B, 5, lorentz_dim)
        job_lorentz    = self.encode_job(job_feat)          # (B, 5, lorentz_dim)
        score          = self.interaction_score(resume_lorentz, job_lorentz)  # (B,)
        return score

    # ── Batch scoring for evaluation (one resume vs many jobs) ────────────────

    @torch.no_grad()
    def score_resume_vs_all_jobs(
        self,
        resume_feat:  torch.Tensor,   # (1, 19)  or  (19,)
        job_feat_mat: torch.Tensor,   # (M, 53)
        batch_size:   int = 1024,
        device:       Optional[torch.device] = None,
    ) -> np.ndarray:
        """
        Compute compatibility scores for one resume against all M jobs.

        Returns: (M,) float32 numpy array of scores.
        """
        self.eval()
        if resume_feat.dim() == 1:
            resume_feat = resume_feat.unsqueeze(0)   # (1, 19)

        if device is None:
            device = next(self.parameters()).device

        resume_feat  = resume_feat.to(device)
        resume_lorentz = self.encode_resume(resume_feat)  # (1, 5, lorentz_dim)

        M = job_feat_mat.shape[0]
        all_scores = np.empty(M, dtype=np.float32)

        for start in range(0, M, batch_size):
            end = min(start + batch_size, M)
            jf  = job_feat_mat[start:end].to(device)                  # (bs, 53)
            job_lorentz = self.encode_job(jf)                          # (bs, 5, D)

            # Expand resume_lorentz to match batch size
            r_exp = resume_lorentz.expand(end - start, -1, -1)        # (bs, 5, D)

            scores = self.interaction_score(r_exp, job_lorentz)        # (bs,)
            all_scores[start:end] = scores.cpu().numpy()

        return all_scores


# ══════════════════════════════════════════════════════════════════════════════
# BPR Loss
# ══════════════════════════════════════════════════════════════════════════════

class BPRLoss(nn.Module):
    """
    Bayesian Personalised Ranking (BPR) pairwise loss:

        L = -log(sigmoid(score_pos - score_neg)) + λ * L2_reg

    L2 regularisation is applied to the spatial projection weights
    of all field encoders (not the bias term).
    """

    def __init__(self, l2_lambda: float = 1e-5):
        super().__init__()
        self.l2_lambda = l2_lambda

    def forward(
        self,
        score_pos: torch.Tensor,   # (B,)
        score_neg: torch.Tensor,   # (B,)
        model:     Optional[nn.Module] = None,
    ) -> torch.Tensor:
        """
        Returns scalar loss.
        If model is provided, L2 regularisation is applied to projection weights.
        """
        bpr = -F.logsigmoid(score_pos - score_neg).mean()

        if model is not None and self.l2_lambda > 0:
            l2 = torch.tensor(0.0, device=score_pos.device)
            for name, param in model.named_parameters():
                if "proj.weight" in name:
                    l2 = l2 + param.pow(2).sum()
            bpr = bpr + self.l2_lambda * l2

        return bpr


# ══════════════════════════════════════════════════════════════════════════════
# Factory
# ══════════════════════════════════════════════════════════════════════════════

def build_model(config: dict) -> Tuple["LorentzFM", "BPRLoss"]:
    """
    Instantiate LorentzFM and BPRLoss from experiment_config.json model block.
    """
    m_cfg = config["model"]
    t_cfg = config["training"]

    model = LorentzFM(
        embed_dim    = m_cfg.get("embedding_dim", 32),
        curvature    = m_cfg.get("lorentz_curvature", -1.0),
        dropout_prob = 0.1,
    )

    loss_fn = BPRLoss(l2_lambda=t_cfg.get("weight_decay", 1e-5))

    return model, loss_fn
