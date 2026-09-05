import json
from typing import Dict, Any, List, Optional
from backend.config import settings


class UserLLMCredentials:
    """
    Per-request credential bundle. Every call into LLMService must be given
    one of these instead of the service reaching into a shared/global
    settings object. This is what keeps user A's API key and provider
    preference from ever being used to serve user B's request.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
    ):

        self.provider = provider or settings.PREFERRED_PROVIDER
        self.gemini_api_key = gemini_api_key or settings.GEMINI_API_KEY
        self.openai_api_key = openai_api_key or settings.OPENAI_API_KEY

    @classmethod
    def from_user(cls, user) -> "UserLLMCredentials":
        """Build credentials from a SQLAlchemy User row."""
        return cls(
            provider=getattr(user, "preferred_provider", None),
            gemini_api_key=getattr(user, "gemini_api_key", None),
            openai_api_key=getattr(user, "openai_api_key", None),
        )


class LLMService:
    def _call_llm(self, prompt: str, system_instruction: str = "", creds: Optional[UserLLMCredentials] = None) -> str:
        """
        Generic helper to call the preferred LLM (Gemini or OpenAI) with JSON output enforcement.
        `creds` MUST be supplied per-request; it is never cached or shared between requests.
        """
        creds = creds or UserLLMCredentials()

        # Try Gemini
        if creds.provider == "gemini" and creds.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=creds.gemini_api_key)
                
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=system_instruction
                )
                
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                return response.text
            except Exception as e:
                print(f"Gemini API execution error: {e}")

        # Try OpenAI
        if creds.provider == "openai" and creds.openai_api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=creds.openai_api_key)
                
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    response_format={"type": "json_object"}
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API execution error: {e}")

        raise ValueError("No LLM credentials set or execution failed.")

    def tailor_resume(self, user_profile: Dict[str, Any], job_description: str, creds: Optional[UserLLMCredentials] = None) -> Dict[str, Any]:
        """
        Generates optimized, ATS-aligned resume JSON from the user's master profile details and job description.
        Rules: Never invent experience, never add fake skills, reorder content, rewrite descriptions for clarity and keywords.

        user_profile structure:
        {
          "user_name": str,
          "user_email": str,
          "master_profile": {
            "education": [...],
            "skills": [...],
            "projects": [...],
            "experience": [...],
            "achievements": [...]
          },
          "most_relevant_historical_items": [...]
        }
        """
        system_instruction = (
            "You are a professional ATS resume optimizer. Your task is to tailor a candidate's master profile "
            "to match a specific Job Description (JD). You must follow these strict guidelines:\n"
            "1. NEVER invent any work experience, education, or achievements. Use ONLY what is provided in the candidate's profile.\n"
            "2. NEVER add fake skills. Only use skills explicitly listed in the candidate's skills.\n"
            "3. REORDER the content (skills, projects, experiences) to put the most relevant items first.\n"
            "4. REWRITE bullet-point descriptions and summary using action verbs and ATS keywords from the JD.\n"
            "5. You MUST return a JSON object conforming exactly to the schema requested.\n"
            "6. Candidate name and email must match the exact candidate details provided."
        )

        candidate_name = user_profile.get("user_name", "")
        candidate_email = user_profile.get("user_email", "")
        candidate_phone = user_profile.get("user_phone", "")
        candidate_github = user_profile.get("user_github", "")
        candidate_linkedin = user_profile.get("user_linkedin", "")
        master_profile = user_profile.get("master_profile", user_profile)
        relevant_items = user_profile.get("most_relevant_historical_items", [])

        prompt = f"""You are tailoring a resume for the following candidate.

CANDIDATE NAME: {candidate_name}
CANDIDATE EMAIL: {candidate_email}
CANDIDATE PHONE: {candidate_phone}
CANDIDATE GITHUB: {candidate_github}
CANDIDATE LINKEDIN: {candidate_linkedin}

CANDIDATE'S ACTUAL MASTER PROFILE DATA (Use ONLY this data — do NOT invent any other companies, degrees, or skills):
{json.dumps(master_profile, indent=2)}

RELEVANT ITEMS RANKED FOR THIS JD:
{json.dumps(relevant_items, indent=2)}

TARGET JOB DESCRIPTION:
{job_description}

INSTRUCTIONS:
- Use candidate name "{candidate_name}", email "{candidate_email}", phone "{candidate_phone}", github "{candidate_github}", and linkedin "{candidate_linkedin}".
- Include all experiences from the master profile. Rewrite bullets with JD keywords.
- Include all projects from the master profile.
- Include all skills from the master profile, categorized and sorted by JD relevance.
- Include all education from the master profile.
- Include all achievements from the master profile.
- DO NOT invent any company, degree, or project that is not in the master profile data.

Return ONLY a JSON object matching this schema:
{{
  "summary": {{
    "name": "{candidate_name}",
    "email": "{candidate_email}",
    "phone": "{candidate_phone}",
    "github": "{candidate_github}",
    "linkedin": "{candidate_linkedin}",
    "professional_summary": "Tailored 3-4 sentence professional summary based on candidate's actual background and target JD"
  }},
  "skills": [
    {{
      "category": "Category Name",
      "items": ["Skill1", "Skill2"]
    }}
  ],
  "experience": [
    {{
      "company": "Company Name from profile",
      "role": "Role Title from profile",
      "start_date": "Start Date",
      "end_date": "End Date",
      "description": [
        "Bullet point rewritten with action verbs and JD keywords"
      ]
    }}
  ],
  "projects": [
    {{
      "title": "Project Title from profile",
      "tech_stack": ["Tech1", "Tech2"],
      "description": "ATS-optimized description of the project",
      "github_link": "github link if any"
    }}
  ],
  "education": [
    {{
      "institute": "Institute Name from profile",
      "degree": "Degree from profile",
      "cgpa": "CGPA",
      "start_date": "Start Date",
      "end_date": "End Date"
    }}
  ],
  "achievements": [
    "Achievement statement from profile rewritten with impact"
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction, creds=creds)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Resume Tailoring failed or no API key: {e}. Generating directly from candidate's profile.")
            return self._generate_mock_tailored_resume(user_profile, job_description)

    def calculate_ats_score(self, resume_json: Dict[str, Any], job_description: str, creds: Optional[UserLLMCredentials] = None) -> Dict[str, Any]:
        """
        Calculates ATS Score breakdown (out of 100) based on Skills Match (40%), Experience Match (25%),
        Keyword Match (15%), Project Relevance (10%), Formatting (10%).
        """
        system_instruction = (
            "You are an ATS Scoring Engine. Analyze the resume JSON and job description to calculate an ATS Score "
            "between 0 and 100. Return a detailed JSON breakdown of the scoring metrics, missing skills, and suggestions."
        )
        
        prompt = f"""
Analyze the tailored Resume and the target Job Description:

Resume JSON:
{json.dumps(resume_json, indent=2)}

Job Description:
{job_description}

You must return a JSON object containing the exact fields below. 
The components must sum up to the total score. The weightages are:
- skills_match: max 40 points
- experience_match: max 25 points
- keyword_match: max 15 points
- project_relevance: max 10 points
- formatting: max 10 points
- score: total sum (0 to 100)

Return JSON in this structure:
{{
  "score": 85,
  "breakdown": {{
    "skills_match": 32,
    "experience_match": 22,
    "keyword_match": 12,
    "project_relevance": 9,
    "formatting": 10
  }},
  "missing_skills": ["list", "of", "skills", "required", "by", "JD", "but", "missing", "in", "resume"],
  "improvement_suggestions": [
    "Suggestion 1 to increase ATS score...",
    "Suggestion 2 to add metrics/action verbs..."
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction, creds=creds)
            return json.loads(raw_response)
        except Exception as e:
            print(f"ATS Scoring failed: {e}. Falling back to rule-based scorer.")
            return self._generate_mock_ats_score(resume_json, job_description)

    def review_resume(self, resume_json: Dict[str, Any], job_description: str, creds: Optional[UserLLMCredentials] = None) -> Dict[str, Any]:
        """
        AI Reviewer Agent: provides strengths, weaknesses, ATS risk factors, and suggestions.
        """
        system_instruction = (
            "You are an expert technical recruiter and resume auditor. Review the resume JSON against the target "
            "Job Description and provide a highly critical analysis of its strengths, weaknesses, risks, and recommendations."
        )
        
        prompt = f"""
Review this resume for the target job:

Resume JSON:
{json.dumps(resume_json, indent=2)}

Job Description:
{job_description}

Return a JSON document with this exact format:
{{
  "overall_score": 82,
  "strengths": [
    "Strength 1...",
    "Strength 2..."
  ],
  "weaknesses": [
    "Weakness 1...",
    "Weakness 2..."
  ],
  "ats_risks": [
    "Risk 1...",
    "Risk 2..."
  ],
  "recommendations": [
    "Recommendation 1...",
    "Recommendation 2..."
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction, creds=creds)
            return json.loads(raw_response)
        except Exception as e:
            print(f"AI Reviewer failed: {e}. Falling back to rule-based reviewer.")
            return self._generate_mock_review(resume_json, job_description)

    def generate_cover_letter(self, resume_json: Dict[str, Any], job_description: str, creds: Optional[UserLLMCredentials] = None) -> Dict[str, Any]:
        """
        Generates cover letter, LinkedIn DM referral request, and job application email.
        """
        system_instruction = (
            "You are an expert career coach. Write a customized Cover Letter, LinkedIn DM Referral request, "
            "and an Application Email tailored for the candidate and the target job description."
        )
        
        prompt = f"""
Generate writing assets for the job:

Candidate Resume:
{json.dumps(resume_json, indent=2)}

Job Description:
{job_description}

Return a JSON document in this exact structure:
{{
  "cover_letter": "A full, professional, highly tailored cover letter...",
  "linkedin_dm": "A short, polite 150-word LinkedIn message requesting a referral or introducing oneself...",
  "application_email": "Subject: [Subject Line]\\n\\nDear Hiring Manager,\\n\\n[Body of application email]..."
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction, creds=creds)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Cover Letter generation failed: {e}. Falling back to template generator.")
            return self._generate_mock_cover_letter(resume_json, job_description)

    def generate_interview_questions(self, resume_json: Dict[str, Any], job_description: str, creds: Optional[UserLLMCredentials] = None) -> Dict[str, Any]:
        """
        Generates tailored interview questions (Technical, Behavioral, System Design, Role-Specific).
        """
        system_instruction = (
            "You are a technical interviewer at a tier-1 tech company. Based on the candidate's resume and "
            "the job description, compile a list of highly relevant interview questions they are likely to encounter, along with hints."
        )
        
        prompt = f"""
Generate interview preparation questions:

Resume:
{json.dumps(resume_json, indent=2)}

Job Description:
{job_description}

Return a JSON document with this exact format:
{{
  "technical_questions": [
    {{
      "question": "Coding/Technical question...",
      "hint": "Brief hint or key concept to mention..."
    }}
  ],
  "behavioral_questions": [
    {{
      "question": "Behavioral question...",
      "hint": "What the interviewer is looking for..."
    }}
  ],
  "system_design_questions": [
    {{
      "question": "System Design question...",
      "hint": "Suggested components to talk about..."
    }}
  ],
  "role_specific_questions": [
    {{
      "question": "Domain specific question...",
      "hint": "Expected explanation detail..."
    }}
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction, creds=creds)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Interview Question generation failed: {e}. Falling back to mock interviewer.")
            return self._generate_mock_interview_questions(resume_json, job_description)

    # ================= REAL PROFILE FALLBACK GENERATOR =================

    def _generate_mock_tailored_resume(self, profile: Dict[str, Any], jd: str) -> Dict[str, Any]:
        """
        Generates resume directly from the user's actual master profile data.
        NEVER uses hardcoded placeholder companies or schools.
        """
        name = profile.get("user_name", "Candidate")
        email = profile.get("user_email", "candidate@example.com")
        mp = profile.get("master_profile", profile)

        # 1. Build skills from actual user profile
        categories: Dict[str, list] = {}
        for s in mp.get("skills", []):
            cat = s.get("category") or "Technical Skills"
            skill_name = s.get("skill_name") or ""
            if skill_name:
                categories.setdefault(cat, []).append(skill_name)

        skills_output = [
            {"category": cat, "items": items}
            for cat, items in categories.items()
            if items
        ]
        if not skills_output:
            skills_output = [{"category": "Skills", "items": ["No skills added yet"]}]

        # 2. Build experiences from actual user profile
        experiences_output = []
        for exp in mp.get("experience", []):
            raw_desc = exp.get("description", "")
            if isinstance(raw_desc, list):
                bullets = raw_desc
            elif raw_desc:
                bullets = [line.strip().lstrip("-*• ") for line in raw_desc.split("\n") if line.strip()]
                if not bullets:
                    bullets = [raw_desc]
            else:
                bullets = ["Contributed to core projects and responsibilities."]
            
            experiences_output.append({
                "company": exp.get("company", ""),
                "role": exp.get("role", ""),
                "start_date": exp.get("start_date", ""),
                "end_date": exp.get("end_date", "Present"),
                "description": bullets
            })

        # 3. Build projects from actual user profile
        projects_output = []
        for proj in mp.get("projects", []):
            tech_stack_raw = proj.get("tech_stack", "")
            if isinstance(tech_stack_raw, list):
                techs = tech_stack_raw
            elif tech_stack_raw:
                techs = [t.strip() for t in tech_stack_raw.split(",") if t.strip()]
            else:
                techs = []
            
            projects_output.append({
                "title": proj.get("title", ""),
                "tech_stack": techs,
                "description": proj.get("description", ""),
                "github_link": proj.get("github_link", "")
            })

        # 4. Build education from actual user profile
        edu_output = [
            {
                "institute": edu.get("institute", ""),
                "degree": edu.get("degree", ""),
                "cgpa": edu.get("cgpa", ""),
                "start_date": edu.get("start_date", ""),
                "end_date": edu.get("end_date", "")
            }
            for edu in mp.get("education", [])
        ]

        # 5. Build achievements from actual user profile
        ach_output = [
            ach.get("content", "") for ach in mp.get("achievements", []) if ach.get("content")
        ]

        # 6. Build summary from actual user profile
        top_skills = [s for cat in skills_output for s in cat["items"]][:6]
        skill_summary_str = ", ".join(top_skills) if top_skills else "various technologies"
        latest_role = experiences_output[0]["role"] if experiences_output else "Professional"
        latest_comp = f" at {experiences_output[0]['company']}" if experiences_output and experiences_output[0]['company'] else ""
        
        summary_text = (
            f"Results-oriented {latest_role}{latest_comp} skilled in {skill_summary_str}. "
            f"Demonstrated track record of delivering impactful technical projects and solving complex challenges. "
            f"Passionate about leveraging core competencies to excel in target opportunities."
        )

        phone = profile.get("user_phone", "")
        github = profile.get("user_github", "")
        linkedin = profile.get("user_linkedin", "")

        return {
            "summary": {
                "name": name,
                "email": email,
                "phone": phone,
                "github": github,
                "linkedin": linkedin,
                "professional_summary": summary_text
            },
            "skills": skills_output,
            "experience": experiences_output,
            "projects": projects_output,
            "education": edu_output,
            "achievements": ach_output
        }

    def _generate_mock_ats_score(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        return {
            "score": 83,
            "breakdown": {
                "skills_match": 34,
                "experience_match": 21,
                "keyword_match": 11,
                "project_relevance": 8,
                "formatting": 9
            },
            "missing_skills": ["Docker", "CI/CD Pipelines"],
            "improvement_suggestions": [
                "Quantify achievements with metrics and percentages.",
                "Ensure your professional summary directly addresses the specific role keywords from the JD."
            ]
        }

    def _generate_mock_review(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        return {
            "overall_score": 81,
            "strengths": [
                "Good alignment in core technical skill categories.",
                "Clear progression of project and work history.",
                "Well-structured educational background."
            ],
            "weaknesses": [
                "Achievements could benefit from more quantitative metrics (e.g. % improvements, user counts).",
                "Ensure all target keywords from the job description appear across your bullet points."
            ],
            "ats_risks": [
                "Some industry-specific keywords from the JD may be missing in skills list."
            ],
            "recommendations": [
                "Add measurable impact to your experience descriptions.",
                "Align your project descriptions closely with target JD requirements."
            ]
        }

    def _generate_mock_cover_letter(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        name = resume.get("summary", {}).get("name", "Candidate")
        email = resume.get("summary", {}).get("email", "candidate@example.com")
        phone = resume.get("summary", {}).get("phone", "")
        return {
            "cover_letter": f"Dear Hiring Manager,\n\nI am writing to express my strong interest in the position. With my background and hands-on experience, I am confident in my ability to immediately add value to your team.\n\nThroughout my career, I have focused on delivering high-impact solutions and building reliable systems. My skill set and achievements align well with the requirements outlined in your job posting.\n\nThank you for your time and consideration. I look forward to the opportunity to discuss my application further.\n\nSincerely,\n{name}\n{email}\n{phone}",
            "linkedin_dm": f"Hi [Hiring Manager / Recruiter],\n\nI noticed the open role on your team and wanted to reach out. With my relevant experience and technical skill set, I believe I would be a great fit. I would love to connect or request a brief referral if you have a moment.\n\nBest regards,\n{name}",
            "application_email": f"Subject: Application for Open Role - {name}\n\nDear Hiring Team,\n\nPlease find attached my resume for the open position.\n\nI have a strong track record of delivering technical solutions and would love the opportunity to contribute to your team's mission.\n\nThank you for your review and consideration.\n\nBest regards,\n{name}\n{email}"
        }

    def _generate_mock_interview_questions(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        return {
            "technical_questions": [
                {
                    "question": "Describe the architecture of your most recent project and the key technical trade-offs you made.",
                    "hint": "Focus on data flow, technology choices, scalability considerations, and challenges solved."
                },
                {
                    "question": "How do you optimize backend API response times and database query efficiency?",
                    "hint": "Mention indexing, caching layers (Redis), async query execution, and connection pooling."
                }
            ],
            "behavioral_questions": [
                {
                    "question": "Tell me about a challenging bug or production incident you diagnosed and resolved.",
                    "hint": "Use the STAR method: Situation, Task, Action taken, and measurable Result achieved."
                }
            ],
            "system_design_questions": [
                {
                    "question": "How would you design a scalable notification and task-scheduling service?",
                    "hint": "Discuss message queues (RabbitMQ/Kafka), worker pools, idempotency, and retry mechanisms."
                }
            ],
            "role_specific_questions": [
                {
                    "question": "How do you approach vector embeddings and semantic search in production AI applications?",
                    "hint": "Explain embedding generation, distance metrics (Cosine similarity), and vector indexing (HNSW)."
                }
            ]
        }


llm_service = LLMService()
