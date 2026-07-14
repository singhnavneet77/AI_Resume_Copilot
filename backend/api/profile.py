from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.database.db import get_db
from backend.database.models import (
    User, Education, Skill, Project, Experience, Achievement
)
from backend.auth.helpers import get_current_user
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/profile", tags=["profile"])

# Schema definitions
class EducationSchema(BaseModel):
    institute: str
    degree: str
    cgpa: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class SkillSchema(BaseModel):
    skill_name: str
    category: str

class ProjectSchema(BaseModel):
    title: str
    description: str
    tech_stack: Optional[str] = None
    github_link: Optional[str] = None

class ExperienceSchema(BaseModel):
    company: str
    role: str
    description: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class AchievementSchema(BaseModel):
    content: str

class MasterProfileResponse(BaseModel):
    education: List[EducationSchema]
    skills: List[SkillSchema]
    projects: List[ProjectSchema]
    experience: List[ExperienceSchema]
    achievements: List[AchievementSchema]

class ProfileUpdate(BaseModel):
    education: List[EducationSchema]
    skills: List[SkillSchema]
    projects: List[ProjectSchema]
    experience: List[ExperienceSchema]
    achievements: List[AchievementSchema]


@router.get("", response_model=MasterProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "education": current_user.education,
        "skills": current_user.skills,
        "projects": current_user.projects,
        "experience": current_user.experience,
        "achievements": current_user.achievements
    }


def index_profile_in_qdrant(user_id: int):
    """
    Background worker task to extract and upload user details into Qdrant vector database.
    Creates its own DB session since the request-scoped session is closed by the time
    this background task runs.
    """
    from backend.database.db import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Gather items to index
        items = []
    
        # Format experience items
        for exp in user.experience:
            text = f"Work Experience: Role {exp.role} at {exp.company}. Description: {exp.description}."
            items.append({"id": f"exp_{exp.id}", "text": text, "metadata": {"type": "experience", "id": exp.id}})
            
        # Format projects
        for proj in user.projects:
            text = f"Project: {proj.title}. Tech Stack: {proj.tech_stack}. Description: {proj.description}."
            items.append({"id": f"proj_{proj.id}", "text": text, "metadata": {"type": "project", "id": proj.id}})
            
        # Format skills
        for skill in user.skills:
            text = f"Skill: {skill.skill_name} in category {skill.category}."
            items.append({"id": f"skill_{skill.id}", "text": text, "metadata": {"type": "skill", "id": skill.id}})
            
        # Format education
        for edu in user.education:
            text = f"Education: Degree {edu.degree} from {edu.institute}. CGPA: {edu.cgpa}."
            items.append({"id": f"edu_{edu.id}", "text": text, "metadata": {"type": "education", "id": edu.id}})
            
        # Format achievements
        for ach in user.achievements:
            text = f"Achievement: {ach.content}."
            items.append({"id": f"ach_{ach.id}", "text": text, "metadata": {"type": "achievement", "id": ach.id}})
            
        # Index using rag service
        if items:
            rag_service.index_user_profile(user_id=user_id, items=items)
    finally:
        db.close()


@router.post("", response_model=MasterProfileResponse)
def update_profile(
    profile_data: ProfileUpdate, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Clear existing entries
        db.query(Education).filter(Education.user_id == current_user.id).delete()
        db.query(Skill).filter(Skill.user_id == current_user.id).delete()
        db.query(Project).filter(Project.user_id == current_user.id).delete()
        db.query(Experience).filter(Experience.user_id == current_user.id).delete()
        db.query(Achievement).filter(Achievement.user_id == current_user.id).delete()
        
        # Insert education
        for edu in profile_data.education:
            new_edu = Education(user_id=current_user.id, **edu.model_dump())
            db.add(new_edu)
            
        # Insert skills
        for skill in profile_data.skills:
            new_skill = Skill(user_id=current_user.id, **skill.model_dump())
            db.add(new_skill)
            
        # Insert projects
        for proj in profile_data.projects:
            new_proj = Project(user_id=current_user.id, **proj.model_dump())
            db.add(new_proj)
            
        # Insert experience
        for exp in profile_data.experience:
            new_exp = Experience(user_id=current_user.id, **exp.model_dump())
            db.add(new_exp)
            
        # Insert achievements
        for ach in profile_data.achievements:
            new_ach = Achievement(user_id=current_user.id, **ach.model_dump())
            db.add(new_ach)
            
        db.commit()
        db.refresh(current_user)
        
        # Trigger vector store re-indexing in the background
        background_tasks.add_task(index_profile_in_qdrant, current_user.id)
        
        return {
            "education": current_user.education,
            "skills": current_user.skills,
            "projects": current_user.projects,
            "experience": current_user.experience,
            "achievements": current_user.achievements
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating profile: {str(e)}"
        )
