# AI Resume Copilot 🚀

AI Resume Copilot is a comprehensive, production-ready AI-powered platform designed to assist job seekers in building, optimizing, and simulating their way to their dream careers. The system leverages state-of-the-art Large Language Models (LLMs) and Vector Databases to perform deep Resume ATS (Applicant Tracking System) analysis, generate tailored cover letters, and provide interactive mock interview practice.

---

## 🌟 Key Features

### 👤 Profile & Experience Management
*   **Structured Profiles:** Maintain up-to-date details of your skills, experiences, and career goals.
*   **Database Synchronization:** Automatically saves and syncs profile settings across sessions.

### 📄 Resume Parsing & Storage
*   **Multi-Resume Upload:** Upload and manage multiple resume versions.
*   **Automatic Parsing:** Extract structural and text data from PDFs and other resume formats.

### 🎯 ATS Optimization & Scan
*   **Resume Scoring:** Analyze your resume against specific Job Descriptions (JDs).
*   **Gap Identification:** Pinpoint missing keywords, experience shortfalls, and formatting issues.
*   **Tailored Suggestions:** Actionable recommendations on what to add, edit, or remove to bypass ATS filters.

### ✉️ AI Cover Letter Generator
*   **Contextual Generation:** Generates a custom cover letter based on your resume, career goals, and the job description.
*   **Professional Formatting:** Instantly exportable text matching professional business standards.

### 🎙️ Interactive Mock Interviews
*   **Job-Specific Questions:** Generates interview questions tailored to the resume and target job role.
*   **Real-time Simulation:** Conduct mock sessions to prepare for behavior and technical rounds.

---

## 🛠️ Architecture & Tech Stack

The application is built using a modern decoupled architecture:

```
 ┌────────────────────────────────────────────────────────┐
 │                      React / Next.js                   │
 │                        (Frontend)                      │
 └───────────────────────────┬────────────────────────────┘
                             │ REST API
 ┌───────────────────────────▼────────────────────────────┐
 │                      FastAPI (Python)                  │
 │                        (Backend)                       │
 └───────────────┬───────────────────────────┬────────────┘
                 │ SQLAlchemy                │ Vector Search
 ┌───────────────▼───────────────┐   ┌───────▼────────────┐
 │            SQLite             │   │    Qdrant DB       │
 │      (Structured Data)        │   │  (Embeddings/RAG)  │
 └───────────────────────────────┘   └────────────────────┘
```

*   **Frontend:** [Next.js 14](https://nextjs.org/) (React), TypeScript, Tailwind CSS, Context API.
*   **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+), Pydantic, SQLAlchemy.
*   **Structured Database:** [SQLite](https://www.sqlite.org/) (relational storage for user profiles and resumes).
*   **Vector Database:** [Qdrant](https://qdrant.tech/) (local path storage for semantic search and Retrieval-Augmented Generation / RAG).
*   **AI Integration:** Dual-provider support for **Google Gemini API** (default) and **OpenAI API**.

---

## 📁 Repository Structure

```text
ResumeProject/
├── backend/                # FastAPI Backend Service
│   ├── api/                # API Route Handlers (auth, ats, cover letter, resume, profile, etc.)
│   ├── auth/               # JWT Authentication Helpers
│   ├── database/           # SQLite DB Connection, Schemas & Models
│   ├── services/           # LLM Service & RAG Vector Search integrations
│   ├── config.py           # Application Settings and Dotenv Parser
│   ├── main.py             # FastAPI App Root and CORS Configuration
│   └── requirements.txt    # Python Dependencies
├── frontend/               # Next.js Frontend Web App
│   ├── src/
│   │   ├── app/            # Next.js App Router (Dashboard, Login, Profiles, ATS Pages)
│   │   └── context/        # React Global Context (Authentication & Session State)
│   ├── package.json        # Frontend Dependencies
│   └── next.config.mjs     # Next.js Configuration
├── resume_copilot.db       # SQLite Database File (generated automatically)
└── qdrant_local_storage/   # Local Vector Database Files (generated automatically)
```

---

## 🚀 Installation & Local Setup

### Prerequisites
Make sure you have the following installed on your system:
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)
*   [Git](https://git-scm.com/)

---

### 1. Backend Setup

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    *   **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure Environment Variables:
    *   Copy the `.env.example` file to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Open `.env` and fill in your details:
        ```ini
        GEMINI_API_KEY=your_gemini_api_key_here
        OPENAI_API_KEY=your_openai_api_key_here
        PREFERRED_PROVIDER=gemini # "gemini" or "openai"
        DATABASE_URL=sqlite:///./resume_copilot.db
        QDRANT_PATH=qdrant_local_storage
        SECRET_KEY=generate_a_secure_random_key_here
        ```

5.  Start the FastAPI Server:
    ```bash
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```
    The backend API should now be running at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can explore the interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### 2. Frontend Setup

1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```

2.  Install packages:
    ```bash
    npm install
    ```

3.  Configure API Access:
    *   By default, the Next.js app communicates with `http://127.0.0.1:8000`. You can change settings directly in the frontend dashboard.

4.  Run the Dev Server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security & Best Practices

*   **Secrets & Configurations:** Never commit `.env` or `resume_copilot.db` database files to public repositories. Ensure they are listed in `.gitignore`.
*   **JWT Tokens:** JWT tokens are configured for authorization with a secure expiration time.
*   **Password Hashing:** Passwords are fully hashed using `bcrypt` (via `passlib`) before database persistence.

---

## 📄 License
This project is proprietary and for educational use only.
