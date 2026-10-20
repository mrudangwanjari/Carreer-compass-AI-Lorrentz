"""
schemas.py
──────────
Pydantic models shared across all API routers.
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email:     str
    password:  str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

class UserOut(BaseModel):
    id:        str
    full_name: str
    email:     str


# ── Resume ─────────────────────────────────────────────────────────────────────

class ParsedResume(BaseModel):
    full_name:            str
    email:                str
    phone:                str
    location:             str
    summary:              str
    current_role:         str
    years_experience:     float
    seniority_level:      str
    education_level:      str
    education_score:      int       = Field(ge=1, le=4)
    degrees:              List[str]
    universities:         List[str]
    tech_skills:          List[str]
    certifications:       List[str]
    skill_count:          int
    cert_count:           int
    companies:            List[str]
    job_titles_found:     List[str]
    industries_mentioned: List[str]
    parse_quality_score:  int       = Field(ge=0, le=100)
    total_text_length:    int
    filename:             str
    file_size_kb:         int
    parsed_at:            str       # ISO timestamp


# ── Jobs ──────────────────────────────────────────────────────────────────────

class JobResult(BaseModel):
    job_id:            str
    title:             str
    company_name:      str
    location:          str
    description:       str
    work_type:         str
    experience_level:  str
    remote_allowed:    bool
    industry:          str
    domain:            str
    match_score:       float       = Field(ge=0, le=100)
    matched_skills:    List[str]
    min_salary:        Optional[float] = None
    max_salary:        Optional[float] = None
    pay_period:        Optional[str]   = None
    posted_days_ago:   int
    applies:           int
    skills_desc:       List[str]
    company_size:      str
    url:               str

class JobsResponse(BaseModel):
    jobs:       List[JobResult]
    total:      int
    query_time_ms: float


# ── Courses ───────────────────────────────────────────────────────────────────

class CourseResult(BaseModel):
    id:          str
    title:       str
    provider:    str
    platform:    str
    level:       str
    domain:      str
    skills:      List[str]
    hours:       int
    rating:      float
    reviews:     int
    price_usd:   object          # int | 'Free'
    url:         str
    description: str
    certificate: bool
    gap_score:   int = 0        # 0–100, missing skills %


# ── Research Domains ───────────────────────────────────────────────────────────

class DomainResult(BaseModel):
    id:          str
    name:        str
    score:       float
    trend:       str
    papers:      int
    top_skills:  List[str]
    description: str


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:      str
    version:     str
    sbert_loaded: bool
    faiss_loaded: bool
    jobs_indexed: int
