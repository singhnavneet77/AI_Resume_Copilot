"""
One-time migration: copy all data from the old local SQLite database into
PostgreSQL, preserving every user's master profile, resumes, and ATS reports.

Usage (run from the `ResumeProject/` project root, backend venv activated):

    python -m backend.scripts.migrate_sqlite_to_postgres \
        --sqlite sqlite:///./resume_copilot.db \
        --postgres postgresql+psycopg2://resume_admin:resume_admin_pw@localhost:5432/resume_copilot

If --postgres is omitted, it reads DATABASE_URL from backend/.env (make sure
that already points at Postgres before running).

The script is idempotent-ish: it skips users that already exist (matched by
email) in the destination database, so it's safe to re-run.
"""
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models import (
    Base, User, Education, Skill, Project, Experience, Achievement,
    ResumeVersion, ATSReport,
)


def get_session(url: str):
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def migrate(sqlite_url: str, postgres_url: str):
    src = get_session(sqlite_url)
    dst = get_session(postgres_url)

    users = src.query(User).all()
    print(f"Found {len(users)} user(s) in source SQLite database.")

    migrated, skipped = 0, 0
    for u in users:
        if dst.query(User).filter(User.email == u.email).first():
            print(f"  - skipping {u.email} (already exists in Postgres)")
            skipped += 1
            continue

        new_user = User(
            name=u.name,
            email=u.email,
            hashed_password=u.hashed_password,
            created_at=u.created_at,
            gemini_api_key=getattr(u, "gemini_api_key", None),
            openai_api_key=getattr(u, "openai_api_key", None),
            preferred_provider=getattr(u, "preferred_provider", "gemini") or "gemini",
        )
        dst.add(new_user)
        dst.flush()  # get new_user.id

        for edu in u.education:
            dst.add(Education(user_id=new_user.id, institute=edu.institute, degree=edu.degree,
                               cgpa=edu.cgpa, start_date=edu.start_date, end_date=edu.end_date))
        for sk in u.skills:
            dst.add(Skill(user_id=new_user.id, skill_name=sk.skill_name, category=sk.category))
        for pr in u.projects:
            dst.add(Project(user_id=new_user.id, title=pr.title, description=pr.description,
                             tech_stack=pr.tech_stack, github_link=pr.github_link))
        for ex in u.experience:
            dst.add(Experience(user_id=new_user.id, company=ex.company, role=ex.role,
                                description=ex.description, start_date=ex.start_date, end_date=ex.end_date))
        for ach in u.achievements:
            dst.add(Achievement(user_id=new_user.id, content=ach.content))

        for rv in u.resumes:
            new_resume = ResumeVersion(
                user_id=new_user.id, jd_title=rv.jd_title, jd_text=rv.jd_text,
                resume_json=rv.resume_json, pdf_url=rv.pdf_url,
                template_name=rv.template_name, created_at=rv.created_at,
            )
            dst.add(new_resume)
            dst.flush()
            if rv.ats_report:
                dst.add(ATSReport(
                    resume_id=new_resume.id, score=rv.ats_report.score,
                    missing_skills=rv.ats_report.missing_skills,
                    improvement_suggestions=rv.ats_report.improvement_suggestions,
                    details_json=rv.ats_report.details_json,
                ))

        migrated += 1
        print(f"  - migrated {u.email}")

    dst.commit()
    print(f"Done. Migrated {migrated} user(s), skipped {skipped} already-existing user(s).")


if __name__ == "__main__":
    import os
    parser = argparse.ArgumentParser()
    parser.add_argument("--sqlite", default="sqlite:///./resume_copilot.db")
    parser.add_argument("--postgres", default=os.getenv("DATABASE_URL"))
    args = parser.parse_args()

    if not args.postgres or not args.postgres.startswith("postgresql"):
        raise SystemExit(
            "Refusing to run: --postgres must be a postgresql:// URL "
            "(or set DATABASE_URL in backend/.env to your Postgres connection string)."
        )

    migrate(args.sqlite, args.postgres)
