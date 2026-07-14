from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any

from backend.auth.helpers import get_current_user
from backend.database.models import User
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])

class CoverLetterRequest(BaseModel):
    resume_json: Dict[str, Any]
    jd_text: str

class CoverLetterResponse(BaseModel):
    cover_letter: str
    linkedin_dm: str
    application_email: str


@router.post("/generate", response_model=CoverLetterResponse)
def generate_cover_letter(data: CoverLetterRequest, current_user: User = Depends(get_current_user)):
    try:
        letter_data = llm_service.generate_cover_letter(
            resume_json=data.resume_json,
            job_description=data.jd_text
        )
        return letter_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}"
        )
