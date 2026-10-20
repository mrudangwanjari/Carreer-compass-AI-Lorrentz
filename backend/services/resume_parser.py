"""
resume_parser.py
────────────────
Extracts structured information from PDF and DOCX resume files.
Uses PyMuPDF for PDF and python-docx for DOCX extraction,
then applies pattern matching identical to the M1 research pipeline
so results are consistent with the training data schema.
"""
from __future__ import annotations
import re
import io
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

# ── Optional heavy imports (graceful fallback if env is limited) ──────────────
try:
    import fitz                        # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


# ── Skill keyword lists ───────────────────────────────────────────────────────
TECH_SKILLS = [
    "Python", "TypeScript", "JavaScript", "Java", "Go", "Rust", "C++", "C#",
    "Ruby", "Swift", "Kotlin", "R", "Scala", "SQL", "Bash", "Shell",
    "React", "Angular", "Vue", "Next.js", "Svelte", "Redux", "HTML", "CSS", "Tailwind",
    "Node.js", "FastAPI", "Django", "Flask", "Express", "Spring", "Rails",
    "GraphQL", "REST", "gRPC", "Kafka", "RabbitMQ",
    "PyTorch", "TensorFlow", "scikit-learn", "BERT", "Transformers", "LangChain",
    "MLflow", "Hugging Face", "Keras", "XGBoost", "FAISS",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Helm",
    "CI/CD", "Airflow", "Spark", "Databricks", "Jenkins", "GitHub Actions",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB",
    "BigQuery", "Snowflake", "dbt", "Pandas", "NumPy",
    "Git", "Agile", "Scrum", "SAFe", "Waterfall", "JIRA", "Confluence",
]

CERT_PATTERNS = [
    r"AWS\s+(?:Certified\s+)?(?:Solutions?\s+Architect|Developer|SysOps|DevOps)",
    r"Google\s+Cloud\s+(?:Professional\s+)?(?:Data\s+Engineer|Architect|Developer)",
    r"CKA|CKAD|CKS",
    r"PMP|PMI|CAPM",
    r"CISSP|CISM|CEH|Security\+",
    r"Certified\s+Scrum\s+Master|CSM|SAFe",
    r"Azure\s+(?:Administrator|Developer|Architect)",
    r"Terraform\s+Associate",
    r"Six\s+Sigma|PMP|ITIL",
]

SENIORITY_MAP = {
    "intern": "Internship",
    "entry": "Entry level",
    "junior": "Entry level",
    "associate": "Associate",
    "mid": "Mid-Senior level",
    "senior": "Mid-Senior level",
    "lead": "Mid-Senior level",
    "principal": "Director",
    "staff": "Director",
    "director": "Director",
    "vp": "Executive",
    "vice president": "Executive",
    "head of": "Executive",
    "cto": "Executive",
    "ceo": "Executive",
}

EDU_LEVELS = {
    "phd": ("PhD", 4),
    "ph.d": ("PhD", 4),
    "doctor": ("PhD", 4),
    "master": ("MS", 4),
    "m.s": ("MS", 4),
    "m.tech": ("MS", 4),
    "mba": ("MBA", 4),
    "bachelor": ("BS", 3),
    "b.tech": ("BS", 3),
    "b.e": ("BS", 3),
    "b.s": ("BS", 3),
    "associate": ("Associate", 2),
    "diploma": ("Diploma", 1),
}


def _extract_text_from_pdf(content: bytes) -> str:
    if not HAS_PYMUPDF:
        return ""
    doc = fitz.open(stream=content, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


def _extract_text_from_docx(content: bytes) -> str:
    if not HAS_DOCX:
        return ""
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)


def _find_skills(text: str) -> List[str]:
    found = []
    text_lower = text.lower()
    for skill in TECH_SKILLS:
        # whole-word match
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return list(dict.fromkeys(found))  # preserve order, dedupe


def _find_certifications(text: str) -> List[str]:
    found = []
    for pat in CERT_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            found.append(m.group(0).strip())
    return list(dict.fromkeys(found))


def _find_email(text: str) -> str:
    m = re.search(r'[\w.+-]+@[\w.-]+\.\w+', text)
    return m.group(0) if m else ""


def _find_phone(text: str) -> str:
    m = re.search(r'[\+\(]?[\d\s\-\(\)]{10,15}', text)
    return m.group(0).strip() if m else ""


def _find_years_experience(text: str) -> float:
    m = re.search(r'(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience|exp)', text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    return 0.0


def _find_seniority(text: str) -> str:
    text_lower = text.lower()
    for kw, level in SENIORITY_MAP.items():
        if kw in text_lower:
            return level
    return "Unknown"


def _find_education(text: str) -> Tuple[str, int, List[str], List[str]]:
    degrees, universities = [], []
    level, score = "BS", 3
    text_lower = text.lower()

    for kw, (lv, sc) in EDU_LEVELS.items():
        if kw in text_lower:
            if sc > score:
                level, score = lv, sc
            # find full degree line
            for line in text.splitlines():
                if kw in line.lower() and len(line.strip()) < 120:
                    degrees.append(line.strip())
                    break

    # Heuristic: lines ending with "University", "Institute", "College"
    for line in text.splitlines():
        l = line.strip()
        if re.search(r'\b(university|institute|college|school)\b', l, re.IGNORECASE):
            if 10 < len(l) < 80:
                universities.append(l)

    return level, score, list(dict.fromkeys(degrees))[:3], list(dict.fromkeys(universities))[:3]


def _extract_name(text: str, filename: str) -> str:
    # First non-empty line that looks like a name (2-4 words, no special chars)
    for line in text.splitlines()[:10]:
        l = line.strip()
        parts = l.split()
        if 2 <= len(parts) <= 4 and all(p.isalpha() for p in parts):
            return l
    # Fallback: derive from filename
    stem = Path(filename).stem
    return stem.replace("_", " ").replace("-", " ").title()


def _extract_summary(text: str) -> str:
    # Look for a paragraph between 80 and 600 chars that reads like a summary
    for para in re.split(r'\n{2,}', text):
        p = para.strip()
        if 80 <= len(p) <= 600 and not re.match(r'^(experience|education|skills|certif)', p.lower()):
            return p
    return ""


def parse_resume(content: bytes, filename: str) -> dict:
    """
    Parse a PDF or DOCX resume into the structured schema used by the
    CareerCompass AI pipeline.
    Returns a dict matching the ParsedResume Pydantic model.
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        raw_text = _extract_text_from_pdf(content)
    elif ext in (".docx", ".doc"):
        raw_text = _extract_text_from_docx(content)
    else:
        raw_text = content.decode("utf-8", errors="ignore")

    if not raw_text.strip():
        raise ValueError("Could not extract text from the uploaded file.")

    skills         = _find_skills(raw_text)
    certifications = _find_certifications(raw_text)
    edu_level, edu_score, degrees, universities = _find_education(raw_text)

    # Heuristic industry detection
    industry_kws = {
        "Technology": ["software", "engineering", "cloud", "ml", "ai", "data"],
        "Finance/Banking": ["banking", "finance", "fintech", "payment", "trading"],
        "Healthcare": ["health", "medical", "clinical", "pharma", "biotech"],
        "Education": ["university", "college", "teaching", "academic", "research"],
        "Manufacturing": ["manufacturing", "automotive", "industrial", "robotics"],
    }
    text_lower = raw_text.lower()
    industries = [ind for ind, kws in industry_kws.items() if any(k in text_lower for k in kws)]
    if not industries:
        industries = ["Technology"]

    name        = _extract_name(raw_text, filename)
    email       = _find_email(raw_text)
    phone       = _find_phone(raw_text)
    years_exp   = _find_years_experience(raw_text)
    seniority   = _find_seniority(raw_text)
    summary     = _extract_summary(raw_text)

    # Quality score
    quality = min(100, 40
        + (20 if len(skills) >= 10 else len(skills) * 2)
        + (10 if email else 0)
        + (10 if degrees else 0)
        + (10 if summary else 0)
        + (10 if years_exp > 0 else 0))

    # Current role: first job-title-like line
    current_role = ""
    title_patterns = [r"(senior|lead|principal|staff|junior|associate)?\s*(software|data|ml|ai|cloud|devops|product|backend|frontend|full[\s-]stack)\s*(engineer|developer|scientist|architect|analyst|manager|lead)"]
    for pat in title_patterns:
        m = re.search(pat, raw_text, re.IGNORECASE)
        if m:
            current_role = m.group(0).strip()
            break

    return {
        "full_name":            name,
        "email":                email,
        "phone":                phone,
        "location":             "",
        "summary":              summary,
        "current_role":         current_role or seniority,
        "years_experience":     years_exp,
        "seniority_level":      seniority,
        "education_level":      edu_level,
        "education_score":      edu_score,
        "degrees":              degrees,
        "universities":         universities,
        "tech_skills":          skills,
        "certifications":       certifications,
        "skill_count":          len(skills),
        "cert_count":           len(certifications),
        "companies":            [],
        "job_titles_found":     [current_role] if current_role else [],
        "industries_mentioned": industries,
        "parse_quality_score":  quality,
        "total_text_length":    len(raw_text),
        "filename":             filename,
        "file_size_kb":         len(content) // 1024,
        "parsed_at":            datetime.utcnow().isoformat() + "Z",
    }
