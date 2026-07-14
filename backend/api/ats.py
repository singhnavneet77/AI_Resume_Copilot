from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List

from backend.auth.helpers import get_current_user
from backend.database.models import User
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/ats", tags=["ats"])

class ATSRequest(BaseModel):
    resume_json: Dict[str, Any]
    jd_text: str

class ATSBreakdown(BaseModel):
    skills_match: int
    experience_match: int
    keyword_match: int
    project_relevance: int
    formatting: int

class ATSResponse(BaseModel):
    score: int
    breakdown: ATSBreakdown
    missing_skills: List[str]
    improvement_suggestions: List[str]


@router.post("/score", response_model=ATSResponse)
def get_ats_score(data: ATSRequest, current_user: User = Depends(get_current_user)):
    try:
        score_report = llm_service.calculate_ats_score(
            resume_json=data.resume_json,
            job_description=data.jd_text
        )
        return score_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate ATS score: {str(e)}"
        )
