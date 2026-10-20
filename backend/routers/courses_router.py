from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseRecsBody(BaseModel):
    skills: List[str]


@router.post("/recommend")
def recommend_courses(body: CourseRecsBody):
    """
    Return courses ranked by skill-gap coverage for the given skill set.
    The gap_score = fraction of course skills NOT already in resume.
    """
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from careercompass.src.data.coursesData import COURSES  # type: ignore

    user_skills = {s.lower() for s in body.skills}
    result = []
    for c in COURSES:
        gap   = [s for s in c.skills if s.lower() not in user_skills]
        score = round(len(gap) / max(len(c.skills), 1) * 100)
        result.append({**c.__dict__, "gap_score": score} if hasattr(c, "__dict__") else {**c, "gap_score": score})

    # sort by gap_score desc (most to learn = highest priority)
    result.sort(key=lambda x: x.get("gap_score", 0), reverse=True)
    return {"courses": result, "total": len(result)}


@router.get("/all")
def get_all_courses():
    """Return all courses without personalisation (for fallback)."""
    # Return the static JS-side data via a thin wrapper
    return {"message": "Use POST /courses/recommend with skills for personalised results."}
