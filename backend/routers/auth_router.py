from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.auth import login, register, demo_login

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    email:    str
    password: str

class RegisterBody(BaseModel):
    full_name: str
    email:     str
    password:  str


@router.post("/login")
def do_login(body: LoginBody):
    try:
        return login(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register")
def do_register(body: RegisterBody):
    try:
        return register(body.full_name, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/demo")
def do_demo():
    """One-click demo sign-in — no credentials needed."""
    return demo_login()
