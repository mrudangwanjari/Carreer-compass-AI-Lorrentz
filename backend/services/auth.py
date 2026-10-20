"""
auth.py
───────
Simple JWT-based auth for CareerCompass AI.
Users are stored in-memory for this research prototype;
swap for a real DB in production.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "careercompass-dev-secret-2026"
ALGORITHM  = "HS256"
TOKEN_TTL_HOURS = 24

# Use pbkdf2_sha256 — more compatible with Python 3.14 than bcrypt
pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ── In-memory user store ──────────────────────────────────────────────────────
_USERS: dict[str, dict] = {}

def _seed_demo() -> None:
    """Seed demo user after pwd_ctx is ready."""
    demo_id = "demo-0000-0000-0000-000000000001"
    _USERS["demo@careercompass.ai"] = {
        "id":            demo_id,
        "full_name":     "Demo User",
        "email":         "demo@careercompass.ai",
        "hashed_password": pwd_ctx.hash("demo1234"),
    }

_seed_demo()


# ── Helpers ───────────────────────────────────────────────────────────────────
def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[str]:
    """Returns email if valid, else None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ── Public API ────────────────────────────────────────────────────────────────
def register(full_name: str, email: str, password: str) -> dict:
    if email in _USERS:
        raise ValueError("Email already registered")
    uid = str(uuid.uuid4())
    _USERS[email] = {
        "id":            uid,
        "full_name":     full_name,
        "email":         email,
        "hashed_password": pwd_ctx.hash(password),
    }
    token = _create_token({"sub": email})
    user  = {k: v for k, v in _USERS[email].items() if k != "hashed_password"}
    return {"access_token": token, "token_type": "bearer", "user": user}


def login(email: str, password: str) -> dict:
    user = _USERS.get(email)
    if not user or not pwd_ctx.verify(password, user["hashed_password"]):
        raise ValueError("Invalid credentials")
    token = _create_token({"sub": email})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {k: v for k, v in user.items() if k != "hashed_password"},
    }


def demo_login() -> dict:
    """One-click demo — no password required."""
    return login("demo@careercompass.ai", "demo1234")


def get_user(email: str) -> Optional[dict]:
    u = _USERS.get(email)
    if not u:
        return None
    return {k: v for k, v in u.items() if k != "hashed_password"}
