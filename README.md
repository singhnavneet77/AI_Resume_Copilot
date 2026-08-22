<div align="center">

# 🚀 AI Resume Copilot

**An intelligent, full-stack career tool that tailors your resume to any job description using AI — with ATS scoring, cover letter generation, and interview prep.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **AI Resume Tailoring** | Generates a fully tailored, ATS-optimized resume from your master profile for any job description |
| 📊 **ATS Score Analyzer** | Breaks down your resume score across Skills Match, Experience, Keywords, Projects & Formatting |
| 🤖 **AI Reviewer** | Expert-level strengths, weaknesses, risks, and improvement recommendations |
| ✉️ **Cover Letter Suite** | Generates a cover letter, LinkedIn DM referral message, and application email |
| 🎤 **Interview Prep** | Tailored technical, behavioral, system design & role-specific interview questions |
| 👤 **Master Profile** | One-time profile setup — reused and intelligently selected for every job |
| 🔍 **RAG-powered Selection** | Qdrant vector search ranks your most relevant experience for each JD |
| 🔐 **Per-user Auth & Keys** | JWT authentication; each user stores their own LLM API key — never shared |
| 🌙 **Dark Mode UI** | Sleek Next.js + Tailwind CSS dashboard with real-time feedback |

---

## 🏗️ Architecture

```
AIResumeCopilot/
├── backend/                    # FastAPI Python backend
│   ├── api/                    # Route handlers
│   │   ├── auth.py             # Register / Login (JWT)
│   │   ├── profile.py          # Master profile CRUD + Qdrant indexing
│   │   ├── resume.py           # Resume generation, history, review
│   │   ├── ats.py              # ATS score endpoint
│   │   ├── cover_letter.py     # Cover letter generation
│   │   ├── interview.py        # Interview question generation
│   │   └── settings.py         # Per-user LLM provider settings
│   ├── auth/
│   │   └── helpers.py          # JWT decode / get_current_user dependency
│   ├── database/
│   │   ├── db.py               # SQLAlchemy engine + session
│   │   └── models.py           # All ORM models (User, Resume, ATS, etc.)
│   ├── services/
│   │   ├── llm_service.py      # Gemini / OpenAI LLM calls + mock fallback
│   │   └── rag_service.py      # Qdrant vector indexing & search
│   ├── scripts/
│   │   └── migrate_sqlite_to_postgres.py
│   ├── config.py               # Pydantic settings (reads .env)
│   ├── main.py                 # FastAPI app + middleware + router registration
│   ├── requirements.txt
│   └── .env.example            # ← copy this to .env and fill in values
│
├── frontend/                   # Next.js 14 (App Router) frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page
│       │   ├── login/                 # Login / Register
│       │   └── (dashboard)/
│       │       ├── dashboard/         # Home dashboard
│       │       ├── profile/           # Master profile editor
│       │       ├── resumes/           # Resume history & viewer
│       │       ├── jd-analysis/       # Resume generation entry point
│       │       ├── reviewer/          # AI resume reviewer
│       │       └── settings/          # LLM provider & API key settings
│       ├── components/
│       │   └── Navbar.tsx
│       └── context/                   # Auth context (JWT storage)
│
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── POSTGRES_SETUP.md           # DB setup guide
└── .env.example
```

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — high-performance Python API framework
- [SQLAlchemy 2](https://www.sqlalchemy.org/) — ORM with PostgreSQL
- [Qdrant](https://qdrant.tech/) — local vector database for RAG profile search
- [Google Gemini](https://ai.google.dev/) / [OpenAI GPT-4o-mini](https://openai.com/) — LLM providers
- [python-jose](https://github.com/mpdavis/python-jose) + [passlib](https://passlib.readthedocs.io/) — JWT auth & bcrypt hashing

**Frontend**
- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [Lucide React](https://lucide.dev/) — icon library

**Infrastructure**
- [PostgreSQL 16](https://www.postgresql.org/) (via Docker or local install)
- [Docker Compose](https://docs.docker.com/compose/) — one-command database setup

---

## ⚡ Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (or Docker Desktop)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/AIResumeCopilot.git
cd AIResumeCopilot
```

---

### 2. Start the Database

**Option A — Docker (recommended, zero config):**
```bash
docker compose up -d postgres
```

**Option B — Local PostgreSQL:**
```sql
-- Run in psql as a superuser
CREATE USER resume_admin WITH PASSWORD 'resume_admin_pw';
CREATE DATABASE resume_copilot OWNER resume_admin;
```

---

### 3. Configure the Backend

```bash
cd backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Edit `backend/.env` and fill in:

```env
DATABASE_URL=postgresql+psycopg2://resume_admin:resume_admin_pw@localhost:5432/resume_copilot
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">

# Add at least one LLM key (or configure per-user in the app Settings page)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PREFERRED_PROVIDER=gemini   # or "openai"
```

---

### 4. Install Backend Dependencies

```bash
# From the project root
pip install -r backend/requirements.txt
```

> Tables are auto-created on first server start via SQLAlchemy — no manual migrations needed.

---

### 5. Start the Backend

```bash
# From the project root
python -m uvicorn backend.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

### 6. Install & Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: **http://localhost:3000**

---

## 🔑 LLM API Keys

API keys can be set in **two ways** (user-level takes priority):

| Method | Scope | How |
|--------|-------|-----|
| `backend/.env` file | System-wide fallback | Edit `GEMINI_API_KEY` / `OPENAI_API_KEY` |
| In-app Settings page | Per user (stored in DB) | Go to Dashboard → Settings |

> Per-user keys are isolated — one user's key is **never** used for another user's request.

**Supported providers:**
- 🟣 **Google Gemini** — `gemini-1.5-flash` (recommended, generous free tier)
- 🟢 **OpenAI** — `gpt-4o-mini`

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `users` | Auth credentials + per-user LLM provider & API key |
| `education` | Master profile: degrees |
| `skills` | Master profile: skills with categories |
| `projects` | Master profile: projects with tech stack |
| `experience` | Master profile: work history |
| `achievements` | Master profile: achievements |
| `resume_versions` | Each AI-generated, JD-tailored resume (stored as JSON) |
| `ats_reports` | ATS score breakdown linked to a resume version |

All child tables use `ON DELETE CASCADE` on `user_id`.

---

## 🔄 How It Works

```
1. User fills Master Profile (skills, experience, projects, education)
       ↓
2. Profile is embedded & indexed in Qdrant (local vector DB)
       ↓
3. User pastes a Job Description → clicks "Generate Resume"
       ↓
4. Qdrant finds the most relevant profile items for this JD
       ↓
5. LLM (Gemini / OpenAI) tailors the resume:
   - Rewrites bullet points with JD keywords & action verbs
   - Reorders skills/projects by relevance
   - Generates a professional summary
   - Never invents experience or fake skills
       ↓
6. ATS Score calculated (Skills 40% + Experience 25% + Keywords 15% + Projects 10% + Format 10%)
       ↓
7. Resume saved to PostgreSQL — view, review, or export anytime
```

---

## 🚀 Deployment

### Backend (any Python host — Railway, Render, Fly.io)
```bash
# Set environment variables on your host, then:
python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel — recommended for Next.js)
```bash
cd frontend
npx vercel --prod
```
Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel environment variables.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ using FastAPI, Next.js, and Gemini AI
</div>
