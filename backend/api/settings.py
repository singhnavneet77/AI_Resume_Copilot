from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database.db import get_db
from backend.database.models import User
from backend.auth.helpers import get_current_user
from backend.config import settings

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    preferred_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None


class SettingsResponse(BaseModel):
    preferred_provider: str
    gemini_api_key: str
    openai_api_key: str
    has_gemini: bool
    has_openai: bool
    qdrant_path: str
    database_url: str


def _mask(key: Optional[str]) -> str:
    """Never send a raw stored key back in full - show only a masked hint."""
    if not key:
        return ""
    if len(key) <= 8:
        return "•" * len(key)
    return f"{key[:4]}{'•' * (len(key) - 8)}{key[-4:]}"


@router.get("", response_model=SettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    """
    Returns the CURRENT user's own LLM provider settings, sourced from
    their row in the `users` table - never from a shared/global object.
    """
    return {
        "preferred_provider": current_user.preferred_provider or "gemini",
        "gemini_api_key": _mask(current_user.gemini_api_key),
        "openai_api_key": _mask(current_user.openai_api_key),
        "has_gemini": bool(current_user.gemini_api_key),
        "has_openai": bool(current_user.openai_api_key),
        "qdrant_path": settings.QDRANT_PATH,
        "database_url": _mask_db_url(settings.DATABASE_URL),
    }


@router.post("", response_model=SettingsResponse)
def update_user_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persists LLM provider settings for the CURRENT authenticated user only,
    scoped by current_user.id. This is the fix for the isolation bug where
    settings used to be written to a single process-wide object shared by
    every logged-in user.
    """
    if data.preferred_provider is not None:
        current_user.preferred_provider = data.preferred_provider


    if data.gemini_api_key is not None and "•" not in data.gemini_api_key:
        current_user.gemini_api_key = data.gemini_api_key or None
    if data.openai_api_key is not None and "•" not in data.openai_api_key:
        current_user.openai_api_key = data.openai_api_key or None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {
        "preferred_provider": current_user.preferred_provider or "gemini",
        "gemini_api_key": _mask(current_user.gemini_api_key),
        "openai_api_key": _mask(current_user.openai_api_key),
        "has_gemini": bool(current_user.gemini_api_key),
        "has_openai": bool(current_user.openai_api_key),
        "qdrant_path": settings.QDRANT_PATH,
        "database_url": _mask_db_url(settings.DATABASE_URL),
    }


def _mask_db_url(url: str) -> str:
    """Don't leak DB credentials (e.g. postgresql://user:pass@host/db) to the client."""
    if "@" in url and "://" in url:
        scheme, rest = url.split("://", 1)
        _, host_part = rest.split("@", 1)
        return f"{scheme}://***:***@{host_part}"
    return url
