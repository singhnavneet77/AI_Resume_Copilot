import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Per-user LLM provider credentials.
    # IMPORTANT: these must stay on (or keyed off) the user row, never in a
    # process-global object, or one user's key/preference leaks into every
    # other user's generation requests (the multi-user isolation bug).
    gemini_api_key = Column(String, nullable=True)
    openai_api_key = Column(String, nullable=True)
    preferred_provider = Column(String, nullable=False, default="gemini")

    # Personal contact details for resumes
    phone = Column(String, nullable=True)
    github = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)

    # Relationships
    education = relationship("Education", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    experience = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeVersion", back_populates="user", cascade="all, delete-orphan")


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    institute = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    cgpa = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)

    user = relationship("User", back_populates="education")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Languages, Frameworks, Libraries, Tools

    user = relationship("User", back_populates="skills")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(String, nullable=True)  # (Python, FastAPI, React)
    github_link = Column(String, nullable=True)

    user = relationship("User", back_populates="projects")


class Experience(Base):
    __tablename__ = "experience"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)

    user = relationship("User", back_populates="experience")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)

    user = relationship("User", back_populates="achievements")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    jd_title = Column(String, nullable=True)
    jd_text = Column(Text, nullable=True)
    resume_json = Column(Text, nullable=False) 
    pdf_url = Column(String, nullable=True)
    template_name = Column(String, default="modern")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    ats_report = relationship("ATSReport", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class ATSReport(Base):
    __tablename__ = "ats_reports"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resume_versions.id", ondelete="CASCADE"), unique=True, nullable=False)
    score = Column(Integer, nullable=False)
    missing_skills = Column(Text, nullable=True)   
    improvement_suggestions = Column(Text, nullable=True) 
    details_json = Column(Text, nullable=True)           

    resume = relationship("ResumeVersion", back_populates="ats_report")
