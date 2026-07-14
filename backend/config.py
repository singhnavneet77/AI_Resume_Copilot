import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Copilot"
    DATABASE_URL: str = "sqlite:///./resume_copilot.db"
    
    # JWT Auth Configuration
    # In production, replace this with a secure generated key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # LLM & Embedding configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    PREFERRED_PROVIDER: str = os.getenv("PREFERRED_PROVIDER", "gemini") # "gemini" or "openai"
    
    # Qdrant local storage path (or ":memory:" for transient in-memory run)
    QDRANT_PATH: str = os.getenv("QDRANT_PATH", "qdrant_local_storage")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
