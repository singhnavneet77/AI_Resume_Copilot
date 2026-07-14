from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List

from backend.auth.helpers import get_current_user
from backend.database.models import User
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/interview", tags=["interview"])

class InterviewRequest(BaseModel):
    resume_json: Dict[str, Any]
    jd_text: str

class QuestionDetail(BaseModel):
    question: str
    hint: str

class InterviewResponse(BaseModel):
    technical_questions: List[QuestionDetail]
    behavioral_questions: List[QuestionDetail]
    system_design_questions: List[QuestionDetail]
    role_specific_questions: List[QuestionDetail]


@router.post("/questions", response_model=InterviewResponse)
def get_interview_questions(data: InterviewRequest, current_user: User = Depends(get_current_user)):
    try:
        questions = llm_service.generate_interview_questions(
            resume_json=data.resume_json,
            job_description=data.jd_text
        )
        return questions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}"
        )
