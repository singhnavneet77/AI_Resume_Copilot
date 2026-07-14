import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.database.db import get_db
from backend.database.models import User, ResumeVersion, ATSReport
from backend.auth.helpers import get_current_user
from backend.services.rag_service import rag_service
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/resume", tags=["resume"])

# Schema definitions
class ResumeGenerateRequest(BaseModel):
    jd_title: str
    jd_text: str
    template_name: Optional[str] = "modern"

class ResumeReviewRequest(BaseModel):
    resume_id: int

@router.post("/generate")
def generate_tailored_resume(
    data: ResumeGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch user's master profile
    profile_dict = {
        "education": [
            {"institute": edu.institute, "degree": edu.degree, "cgpa": edu.cgpa, "start_date": edu.start_date, "end_date": edu.end_date}
            for edu in user.education
        ],
        "skills": [
            {"skill_name": sk.skill_name, "category": sk.category}
            for sk in user.skills
        ],
        "projects": [
            {"title": prj.title, "description": prj.description, "tech_stack": prj.tech_stack, "github_link": prj.github_link}
            for prj in user.projects
        ],
        "experience": [
            {"company": exp.company, "role": exp.role, "description": exp.description, "start_date": exp.start_date, "end_date": exp.end_date}
            for exp in user.experience
        ],
        "achievements": [
            {"content": ach.content}
            for ach in user.achievements
        ]
    }
    
    # Check if profile is empty
    is_empty = all(len(v) == 0 for v in profile_dict.values())
    if is_empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your master profile is empty. Please complete your profile before generating a tailored resume."
        )

    # 2. Run Qdrant Vector search to retrieve matching items
    # We query Qdrant using the job description to find the most relevant items in their profile
    try:
        qdrant_matches = rag_service.query_profile(user_id=user.id, query_text=data.jd_text, limit=8)
        retrieved_context = [match["payload"] for match in qdrant_matches]
    except Exception as e:
        print(f"RAG search error: {e}. Falling back to full profile.")
        retrieved_context = []
        
    # Inject retrieved relevance context into the tailoring payload
    tailor_payload = {
        "user_name": user.name,
        "user_email": user.email,
        "master_profile": profile_dict,
        "most_relevant_historical_items": retrieved_context
    }

    # 3. LLM Tailoring Call
    try:
        tailored_json = llm_service.tailor_resume(
            user_profile=tailor_payload,
            job_description=data.jd_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor resume: {str(e)}"
        )

    # 4. Calculate ATS Score
    try:
        ats_score_data = llm_service.calculate_ats_score(
            resume_json=tailored_json,
            job_description=data.jd_text
        )
    except Exception as e:
        print(f"Failed to pre-calculate ATS score: {e}")
        ats_score_data = {
            "score": 75,
            "breakdown": {"skills_match": 30, "experience_match": 20, "keyword_match": 10, "project_relevance": 7, "formatting": 8},
            "missing_skills": [],
            "improvement_suggestions": ["Failed to run LLM score. Using base score."]
        }

    # 5. Save ResumeVersion to database
    try:
        new_resume = ResumeVersion(
            user_id=user.id,
            jd_title=data.jd_title,
            jd_text=data.jd_text,
            resume_json=json.dumps(tailored_json),
            template_name=data.template_name
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        
        # Save ATS Report
        new_ats = ATSReport(
            resume_id=new_resume.id,
            score=ats_score_data["score"],
            missing_skills=",".join(ats_score_data.get("missing_skills", [])),
            improvement_suggestions=json.dumps(ats_score_data.get("improvement_suggestions", [])),
            details_json=json.dumps(ats_score_data.get("breakdown", {}))
        )
        db.add(new_ats)
        db.commit()
        db.refresh(new_resume)
        
        return {
            "id": new_resume.id,
            "jd_title": new_resume.jd_title,
            "jd_text": new_resume.jd_text,
            "resume_json": tailored_json,
            "template_name": new_resume.template_name,
            "created_at": new_resume.created_at,
            "ats_report": {
                "score": new_ats.score,
                "missing_skills": ats_score_data.get("missing_skills", []),
                "improvement_suggestions": ats_score_data.get("improvement_suggestions", []),
                "breakdown": ats_score_data.get("breakdown", {})
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save resume version: {str(e)}"
        )


@router.post("/review")
def review_resume(data: ResumeReviewRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(ResumeVersion).filter(ResumeVersion.id == data.resume_id, ResumeVersion.user_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found.")
        
    try:
        resume_json = json.loads(resume.resume_json)
        review_data = llm_service.review_resume(
            resume_json=resume_json,
            job_description=resume.jd_text
        )
        return review_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to review resume: {str(e)}"
        )


@router.get("/history")
def get_resume_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(ResumeVersion).filter(ResumeVersion.user_id == user.id).order_by(ResumeVersion.created_at.desc()).all()
    
    output = []
    for r in resumes:
        ats = r.ats_report
        ats_data = None
        if ats:
            ats_data = {
                "score": ats.score,
                "missing_skills": [s.strip() for s in ats.missing_skills.split(",")] if ats.missing_skills else [],
                "improvement_suggestions": json.loads(ats.improvement_suggestions) if ats.improvement_suggestions else [],
                "breakdown": json.loads(ats.details_json) if ats.details_json else {}
            }
            
        output.append({
            "id": r.id,
            "jd_title": r.jd_title,
            "template_name": r.template_name,
            "created_at": r.created_at,
            "ats_report": ats_data
        })
    return output


@router.get("/{resume_id}")
def get_resume_version(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(ResumeVersion).filter(ResumeVersion.id == resume_id, ResumeVersion.user_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found.")
        
    ats = resume.ats_report
    ats_data = None
    if ats:
        ats_data = {
            "score": ats.score,
            "missing_skills": [s.strip() for s in ats.missing_skills.split(",")] if ats.missing_skills else [],
            "improvement_suggestions": json.loads(ats.improvement_suggestions) if ats.improvement_suggestions else [],
            "breakdown": json.loads(ats.details_json) if ats.details_json else {}
        }
        
    return {
        "id": resume.id,
        "jd_title": resume.jd_title,
        "jd_text": resume.jd_text,
        "resume_json": json.loads(resume.resume_json),
        "template_name": resume.template_name,
        "created_at": resume.created_at,
        "ats_report": ats_data
    }


@router.delete("/{resume_id}")
def delete_resume_version(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(ResumeVersion).filter(ResumeVersion.id == resume_id, ResumeVersion.user_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found.")
        
    db.delete(resume)
    db.commit()
    return {"detail": "Resume version deleted successfully"}
