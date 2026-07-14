from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database.db import engine, Base
from backend.database import models  # Ensure models are imported for create_all to find them
from backend.api import auth, profile, resume, ats, cover_letter, interview

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for the AI Resume Copilot system",
    version="1.0.0"
)

# Configure CORS for Next.js local development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(ats.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")
app.include_router(interview.router, prefix="/api")

# Settings Endpoints
@app.post("/api/settings")
def update_settings(data: dict):
    # Update settings in-memory
    settings.GEMINI_API_KEY = data.get("gemini_api_key", settings.GEMINI_API_KEY)
    settings.OPENAI_API_KEY = data.get("openai_api_key", settings.OPENAI_API_KEY)
    settings.PREFERRED_PROVIDER = data.get("preferred_provider", settings.PREFERRED_PROVIDER)
    
    # Write to backend/.env
    try:
        with open("backend/.env", "w") as f:
            f.write(f"GEMINI_API_KEY={settings.GEMINI_API_KEY}\n")
            f.write(f"OPENAI_API_KEY={settings.OPENAI_API_KEY}\n")
            f.write(f"PREFERRED_PROVIDER={settings.PREFERRED_PROVIDER}\n")
            f.write(f"QDRANT_PATH={settings.QDRANT_PATH}\n")
            f.write(f"DATABASE_URL={settings.DATABASE_URL}\n")
            f.write(f"SECRET_KEY={settings.SECRET_KEY}\n")
    except Exception as e:
        print(f"Failed to write .env: {e}")
        
    return {
        "status": "success",
        "preferred_provider": settings.PREFERRED_PROVIDER,
        "has_gemini": bool(settings.GEMINI_API_KEY),
        "has_openai": bool(settings.OPENAI_API_KEY)
    }

@app.get("/api/settings")
def get_settings():
    return {
        "preferred_provider": settings.PREFERRED_PROVIDER,
        "gemini_api_key": settings.GEMINI_API_KEY,
        "openai_api_key": settings.OPENAI_API_KEY,
        "qdrant_path": settings.QDRANT_PATH,
        "database_url": settings.DATABASE_URL
    }

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
