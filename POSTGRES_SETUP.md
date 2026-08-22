# PostgreSQL Setup & Data Flow Guide

This project now runs entirely on **PostgreSQL** as its database of record. Every
user's login credentials, master profile, generated resumes, and settings live
in Postgres, correctly scoped per user.

## 1. Start PostgreSQL

Easiest path — Docker Compose (spins up Postgres + optional pgAdmin UI):

```bash
cd ResumeProject
docker compose up -d
```

This creates a `resume_copilot` database with user `resume_admin` / password
`resume_admin_pw` on `localhost:5432` (change these in `docker-compose.yml`
for anything beyond local dev).

No Docker? Install Postgres natively and create the DB yourself:

```bash
createuser -P resume_admin          # set password when prompted
createdb -O resume_admin resume_copilot
```

## 2. Point the backend at Postgres

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:

```
DATABASE_URL=postgresql+psycopg2://resume_admin:resume_admin_pw@localhost:5432/resume_copilot
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
```

## 3. Install dependencies & create tables

```bash
pip install -r requirements.txt --break-system-packages   # or use a venv
```

Tables are auto-created on first run via SQLAlchemy's `Base.metadata.create_all`
(see `backend/main.py`) — no manual SQL needed for a fresh database.

## 4. (Optional) Migrate existing SQLite data

If you already have data in the old `resume_copilot.db` SQLite file:

```bash
# from the ResumeProject/ project root
python -m backend.scripts.migrate_sqlite_to_postgres
```

This copies every user, their full master profile (education, skills,
projects, experience, achievements), resume versions, and ATS reports into
Postgres, skipping any user that already exists there.

## 5. Run the app

```bash
# backend
cd backend
uvicorn main:app --reload --port 8000

# frontend (separate terminal)
cd frontend
npm run dev
```

Visit `http://localhost:3000`.

---

## How data flows: Login → Master Profile → Everything

```
┌──────────────┐   POST /api/auth/register or /login   ┌─────────────────────┐
│  Login page  │ ─────────────────────────────────────▶│  users table (PG)   │
│  (frontend)  │◀───────── JWT access_token ────────────│  id, name, email,   │
└──────┬───────┘                                        │  hashed_password,   │
       │  every request after this sends                │  gemini/openai keys,│
       │  "Authorization: Bearer <token>"                │  preferred_provider │
       ▼                                                 └─────────┬───────────┘
┌───────────────────────────────────────────────────────────────┐ │
│ backend/auth/helpers.py → get_current_user(token) decodes the │ │
│ JWT, looks up the row in `users` by email, and injects it as  │ │
│ `current_user` into every protected route below.              │ │
└───────────────────────────────────────────────────────────────┘ │
       │                                                           │
       ▼                                                           │
┌───────────────────────────────────────────────────────────────┐ │
│ Master Profile (GET/POST /api/profile) — always filtered by    │◀┘
│ current_user.id:                                                │
│   education, skills, projects, experience, achievements         │
│ Each row carries a `user_id` foreign key → users.id (CASCADE).  │
└─────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│ Resume generation (POST /api/resume/generate) reads ONLY       │
│ current_user's profile rows, tailors them against a job        │
│ description, and stores the result in resume_versions          │
│ (+ ats_reports), each tagged with the same user_id.             │
└───────────────────────────────────────────────────────────────┘
```

### The isolation bug this fixes

Previously, LLM provider settings (Gemini/OpenAI API key, preferred provider)
were stored in a single **process-wide Python object** (`backend/config.py`'s
`settings` singleton), updated in place by `POST /api/settings`. Because that
object is shared by every request the server handles, one user saving their
API key would silently overwrite it for *every other logged-in user* — and
the mock/fallback generator that runs when no key is configured was also
reading straight from that same shared object rather than from the specific
request's `current_user`.

The fix, now in place:

- `gemini_api_key`, `openai_api_key`, and `preferred_provider` are columns on
  the `users` table (see `backend/database/models.py`), so they live and die
  with that specific user's row.
- `backend/api/settings.py` is a fully authenticated router — `GET/POST
  /api/settings` always reads/writes `current_user`'s own row, never a
  shared object.
- `backend/services/llm_service.py` no longer reads `config.settings` inside
  request logic. Every method now requires a `UserLLMCredentials` object
  (built via `UserLLMCredentials.from_user(current_user)`) to be passed in
  explicitly by the caller, so there's no path for one request to
  accidentally pick up another user's key.

## Tables (all in PostgreSQL)

| Table            | Purpose                                             | Scoped by         |
|-------------------|------------------------------------------------------|--------------------|
| `users`           | Login identity + per-user LLM provider settings      | —                  |
| `education`       | Master profile: degrees                               | `user_id`          |
| `skills`          | Master profile: skills                                 | `user_id`          |
| `projects`        | Master profile: projects                                | `user_id`          |
| `experience`      | Master profile: work history                            | `user_id`          |
| `achievements`    | Master profile: achievements                             | `user_id`          |
| `resume_versions` | Each generated, JD-tailored resume                        | `user_id`          |
| `ats_reports`     | ATS score breakdown for a resume version                   | `resume_id`        |

All child tables use `ON DELETE CASCADE`, so deleting a user cleanly removes
all of their data.
