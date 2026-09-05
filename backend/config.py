import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv


ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)
load_dotenv() 

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Copilot"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://resume_admin:resume_admin_pw@localhost:5432/resume_copilot")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    PREFERRED_PROVIDER: str = os.getenv("PREFERRED_PROVIDER", "gemini") # "gemini" or "openai"
    

    QDRANT_PATH: str = os.getenv("QDRANT_PATH", "qdrant_local_storage")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
