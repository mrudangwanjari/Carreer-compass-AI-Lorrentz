from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/resume", tags=["resume"])

MAX_SIZE_MB = 10


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Upload a PDF or DOCX resume and get back the parsed profile.
    """
    from ..services.resume_parser import parse_resume

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx", "doc"):
        raise HTTPException(400, "Only PDF and DOCX files are supported.")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_SIZE_MB} MB limit.")
    if not content:
        raise HTTPException(400, "Uploaded file is empty.")

    try:
        result = parse_resume(content, file.filename or "resume.pdf")
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Parsing error: {e}")

    return result
