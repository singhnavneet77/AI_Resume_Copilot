from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database.db import engine, Base
from backend.database import models 
from backend.api import auth, profile, resume, ats, cover_letter, interview, tracker, settings as settings_api

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for the AI Resume Copilot system",
    version="1.0.0"
)


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


app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(ats.router, prefix="/api")
app.include_router(cover_letter.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(tracker.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")

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
