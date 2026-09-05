import os
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import datetime

from backend.database.models import User
from backend.auth.helpers import get_current_user

router = APIRouter(prefix="/tracker", tags=["tracker"])

TRACKER_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "tracker"
TRACKER_DATA_DIR.mkdir(parents=True, exist_ok=True)


class JobApplicationSchema(BaseModel):
    id: Optional[str] = None
    company: str
    role: str
    status: str = "Applied" 
    location: Optional[str] = "Remote"
    salary: Optional[str] = ""
    date_applied: Optional[str] = None
    job_url: Optional[str] = ""
    notes: Optional[str] = ""
    next_step: Optional[str] = ""


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    date_applied: Optional[str] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    next_step: Optional[str] = None


def _get_user_tracker_file(user_id: int) -> Path:
    return TRACKER_DATA_DIR / f"user_{user_id}.json"


def _load_applications(user_id: int) -> List[dict]:
    file_path = _get_user_tracker_file(user_id)
    if not file_path.exists():
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_applications(user_id: int, applications: List[dict]):
    file_path = _get_user_tracker_file(user_id)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(applications, f, indent=2)


@router.get("", response_model=List[JobApplicationSchema])
def get_job_applications(current_user: User = Depends(get_current_user)):
    """Fetch all job applications for the logged-in user."""
    return _load_applications(current_user.id)


@router.post("", response_model=JobApplicationSchema)
def create_job_application(
    app_data: JobApplicationSchema,
    current_user: User = Depends(get_current_user)
):
    """Add a new job application to the user's tracker."""
    applications = _load_applications(current_user.id)
    
    app_dict = app_data.model_dump()
    app_dict["id"] = f"job_{int(datetime.datetime.utcnow().timestamp() * 1000)}"
    if not app_dict.get("date_applied"):
        app_dict["date_applied"] = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        
    applications.insert(0, app_dict)
    _save_applications(current_user.id, applications)
    return app_dict


@router.patch("/{app_id}", response_model=JobApplicationSchema)
def update_job_application(
    app_id: str,
    update_data: JobApplicationUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update status, stage, notes, or details of a job application."""
    applications = _load_applications(current_user.id)
    found_idx = None
    for idx, item in enumerate(applications):
        if item.get("id") == app_id:
            found_idx = idx
            break
            
    if found_idx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found."
        )
        
    current_app = applications[found_idx]
    update_dict = update_data.model_dump(exclude_unset=True)
    current_app.update(update_dict)
    
    applications[found_idx] = current_app
    _save_applications(current_user.id, applications)
    return current_app


@router.delete("/{app_id}")
def delete_job_application(
    app_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a job application from the tracker."""
    applications = _load_applications(current_user.id)
    new_apps = [app for app in applications if app.get("id") != app_id]
    
    if len(new_apps) == len(applications):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found."
        )
        
    _save_applications(current_user.id, new_apps)
    return {"detail": "Job application deleted successfully"}
