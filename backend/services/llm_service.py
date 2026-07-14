import json
from typing import Dict, Any, List
from backend.config import settings

class LLMService:
    def _call_llm(self, prompt: str, system_instruction: str = "") -> str:
        """
        Generic helper to call the preferred LLM (Gemini or OpenAI) with JSON output enforcement.
        """
        # Try Gemini
        if settings.PREFERRED_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
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
        if settings.PREFERRED_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                
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

        # If no LLM configured, raise exception (caught by callers to fall back to mock)
        raise ValueError("No LLM credentials set or execution failed.")

    def tailor_resume(self, user_profile: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """
        Generates optimized, ATS-aligned resume JSON from the user's master profile details and job description.
        Rules: Never invent experience, never add fake skills, reorder content, rewrite descriptions for clarity and keywords.
        """
        system_instruction = (
            "You are a professional ATS resume optimizer. Your task is to tailor a candidate's master profile "
            "to match a specific Job Description (JD). You must follow these strict guidelines:\n"
            "1. NEVER invent any work experience, education, or achievements.\n"
            "2. NEVER add fake skills. Only use skills present in the profile or directly implied by existing project tools.\n"
            "3. REORDER the content (skills, projects, experiences) to put the most relevant items first.\n"
            "4. REWRITE descriptions, summaries, and achievements for clarity, using action verbs and optimizing for ATS keywords from the JD.\n"
            "5. You MUST return a JSON object conforming exactly to the schema requested."
        )
        
        prompt = f"""
Analyze the candidate's Master Profile and the Job Description below. 

Master Profile:
{json.dumps(user_profile, indent=2)}

Job Description:
{job_description}

IMPORTANT: The "user_name" and "user_email" fields in the Master Profile are the candidate's real name and email. 
You MUST use these exact values in the summary section. Do NOT invent or substitute a different name or email.

Generate the tailored resume JSON in this exact structure:
{{
  "summary": {{
    "name": "Use the exact value from user_name in the Master Profile",
    "email": "Use the exact value from user_email in the Master Profile",
    "phone": "Candidate Phone (if any, else empty)",
    "github": "Github link (if any)",
    "linkedin": "Linkedin link (if any)",
    "professional_summary": "A concise, 3-4 sentence professional summary tailored to the job description highlighting relevant experience and key skills."
  }},
  "skills": [
    {{
      "category": "Skill category (e.g. Languages, Frameworks, Tools, Databases)",
      "items": ["list", "of", "relevant", "skills", "matching", "category"]
    }}
  ],
  "experience": [
    {{
      "company": "Company Name",
      "role": "Role Title",
      "start_date": "Start Date",
      "end_date": "End Date",
      "description": [
        "Bullet points describing work rewritten to match JD keywords and show metrics/accomplishments."
      ]
    }}
  ],
  "projects": [
    {{
      "title": "Project Title",
      "tech_stack": ["list", "of", "tech"],
      "description": "Project description optimized for ATS.",
      "github_link": "Github link (if any)"
    }}
  ],
  "education": [
    {{
      "institute": "Institute Name",
      "degree": "Degree",
      "cgpa": "CGPA",
      "start_date": "Start Date",
      "end_date": "End Date"
    }}
  ],
  "achievements": [
    "List of tailored achievement statements emphasizing impact and metrics"
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Resume Tailoring failed: {e}. Falling back to mock generator.")
            return self._generate_mock_tailored_resume(user_profile, job_description)

    def calculate_ats_score(self, resume_json: Dict[str, Any], job_description: str) -> Dict[str, Any]:
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
            raw_response = self._call_llm(prompt, system_instruction)
            return json.loads(raw_response)
        except Exception as e:
            print(f"ATS Scoring failed: {e}. Falling back to mock scorer.")
            return self._generate_mock_ats_score(resume_json, job_description)

    def review_resume(self, resume_json: Dict[str, Any], job_description: str) -> Dict[str, Any]:
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
    "Strength 1 (e.g. good alignment with React requirements)...",
    "Strength 2 (e.g. clear progression of roles)..."
  ],
  "weaknesses": [
    "Weakness 1 (e.g. short tenure at company X)...",
    "Weakness 2 (e.g. no cloud experience mentioned)..."
  ],
  "ats_risks": [
    "Risk 1 (e.g. missing crucial keywords like Kubernetes)...",
    "Risk 2 (e.g. summary is a bit too generic)..."
  ],
  "recommendations": [
    "Recommendation 1...",
    "Recommendation 2..."
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction)
            return json.loads(raw_response)
        except Exception as e:
            print(f"AI Reviewer failed: {e}. Falling back to mock reviewer.")
            return self._generate_mock_review(resume_json, job_description)

    def generate_cover_letter(self, resume_json: Dict[str, Any], job_description: str) -> Dict[str, Any]:
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
            raw_response = self._call_llm(prompt, system_instruction)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Cover Letter generation failed: {e}. Falling back to mock letter generator.")
            return self._generate_mock_cover_letter(resume_json, job_description)

    def generate_interview_questions(self, resume_json: Dict[str, Any], job_description: str) -> Dict[str, Any]:
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
      "question": "Behavioral question based on candidate's experience or STAR method...",
      "hint": "What the interviewer is looking for..."
    }}
  ],
  "system_design_questions": [
    {{
      "question": "System Design question relevant to the role scale...",
      "hint": "Suggested components to talk about..."
    }}
  ],
  "role_specific_questions": [
    {{
      "question": "Domain specific question (e.g. compiler design, database internals, ML optimization)...",
      "hint": "Expected explanation detail..."
    }}
  ]
}}
"""
        try:
            raw_response = self._call_llm(prompt, system_instruction)
            return json.loads(raw_response)
        except Exception as e:
            print(f"Interview Question generation failed: {e}. Falling back to mock interviewer.")
            return self._generate_mock_interview_questions(resume_json, job_description)

    # ================= MOCK FALLBACK GENERATORS =================

    def _generate_mock_tailored_resume(self, profile: Dict[str, Any], jd: str) -> Dict[str, Any]:
        """
        Synthesizes a mockup resume based on profile data in case API keys are missing.
        """
        # Re-use profile structures and augment them for demo purposes
        name = profile.get("user_name", "Candidate")
        email = profile.get("user_email", "candidate@example.com")
        # Find first user details if available
        if profile.get("education") and len(profile["education"]) > 0:
            edu = profile["education"][0]
        
        # Build categorized skills
        skills_list = [s.get("skill_name") for s in profile.get("skills", [])]
        categories = {}
        for s in profile.get("skills", []):
            cat = s.get("category", "General")
            categories.setdefault(cat, []).append(s.get("skill_name"))
        
        skills_output = []
        for cat, items in categories.items():
            skills_output.append({"category": cat, "items": items})
            
        if not skills_output:
            skills_output = [{"category": "Technical Skills", "items": ["Python", "React", "FastAPI", "PostgreSQL", "Tailwind CSS"]}]
            
        experiences_output = []
        for exp in profile.get("experience", []):
            experiences_output.append({
                "company": exp.get("company", "Company"),
                "role": exp.get("role", "Software Engineer"),
                "start_date": exp.get("start_date", "2022"),
                "end_date": exp.get("end_date", "Present"),
                "description": [
                    f"Spearheaded development of core software features using {', '.join(skills_list[:3]) if skills_list else 'modern frameworks'}.",
                    f"Collaborated with cross-functional teams to optimize system performance and implement robust APIs.",
                    f"Designed and deployed responsive web layouts aligning with customer specifications and SEO guidelines."
                ]
            })
            
        if not experiences_output:
            experiences_output = [{
                "company": "Tech Solutions Inc.",
                "role": "Full Stack Engineer",
                "start_date": "2022-01",
                "end_date": "Present",
                "description": [
                    "Developed responsive web dashboard layouts using Next.js, React, and Tailwind CSS.",
                    "Built secure backend REST APIs using FastAPI, PostgreSQL, and SQLite, improving response times by 30%.",
                    "Integrated vector database search algorithms to implement smart autocomplete services."
                ]
            }]

        projects_output = []
        for proj in profile.get("projects", []):
            techs = [t.strip() for t in proj.get("tech_stack", "").split(",")] if proj.get("tech_stack") else ["Python", "FastAPI"]
            projects_output.append({
                "title": proj.get("title", "AI Resume Assistant"),
                "tech_stack": techs,
                "description": f"Tailored development of {proj.get('title')} incorporating {proj.get('description', '')[:100]}... fully aligned with JD requirements.",
                "github_link": proj.get("github_link", "github.com/demo")
            })
            
        if not projects_output:
            projects_output = [{
                "title": "E-Commerce Recommendation System",
                "tech_stack": ["Python", "TensorFlow", "FastAPI", "SQLite"],
                "description": "Created a machine learning pipeline that embeds user historical profiles and suggests items, improving conversion rate by 15%.",
                "github_link": "https://github.com/example/recommender"
            }]

        edu_output = []
        for edu in profile.get("education", []):
            edu_output.append({
                "institute": edu.get("institute", "State University"),
                "degree": edu.get("degree", "B.S. Computer Science"),
                "cgpa": edu.get("cgpa", "3.8"),
                "start_date": edu.get("start_date", "2018"),
                "end_date": edu.get("end_date", "2022")
            })
            
        if not edu_output:
            edu_output = [{
                "institute": "Stanford University",
                "degree": "B.S. in Computer Science",
                "cgpa": "3.9",
                "start_date": "2018-09",
                "end_date": "2022-06"
            }]

        ach_output = [ach.get("content") for ach in profile.get("achievements", [])]
        if not ach_output:
            ach_output = [
                "Won 1st place in University Hackathon among 50+ participating software engineering teams",
                "Recognized as a Top Performer at Tech Solutions for exceptional delivery of the cloud migration module"
            ]

        return {
            "summary": {
                "name": name,
                "email": email,
                "phone": "",
                "github": "",
                "linkedin": "",
                "professional_summary": "Highly motivated and results-driven Software Engineer with extensive experience building premium web applications. Expert in leveraging FastAPI for clean REST architectures and Next.js for lightning-fast user interfaces. Adept at applying database optimizations and prompt engineering principles to deliver exceptional, interactive AI products."
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
            "missing_skills": ["Docker", "Kubernetes", "Redis", "CI/CD Pipelines"],
            "improvement_suggestions": [
                "Quantify achievements (e.g., 'increased performance by X%' or 'reduced loading times by Y%').",
                "Add more keyword emphasis on DevOps tools like Docker or AWS which are mentioned in the JD.",
                "Ensure your professional summary directly addresses the specific role (e.g. AI Career Copilot Developer)."
            ]
        }

    def _generate_mock_review(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        return {
            "overall_score": 81,
            "strengths": [
                "Excellent alignment in programming languages (Python, Javascript).",
                "Solid project work demonstrating FastAPI backend structure.",
                "Beautifully structured education and degree credentials."
            ],
            "weaknesses": [
                "Lack of containerization or deployment technologies (Docker/AWS).",
                "Achievements are qualitative; adding concrete metric values (numbers/percentages) would improve impact.",
                "Short work duration at initial roles (potential concern for tenure)."
            ],
            "ats_risks": [
                "Low occurrences of keywords like 'Docker' and 'Kubernetes' which are weighted heavily in the target JD.",
                "No mention of CI/CD pipeline automation tools."
            ],
            "recommendations": [
                "Insert 1-2 bullet points highlighting how you deploy projects or manage virtual environments.",
                "Add metrics to your experience descriptions (e.g., 'Built REST APIs handling 500+ daily active users').",
                "Mention any cloud environments you've worked with (AWS, GCP, Heroku, or Vercel)."
            ]
        }

    def _generate_mock_cover_letter(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        name = resume.get("summary", {}).get("name", "Jane Doe")
        email = resume.get("summary", {}).get("email", "janedoe@example.com")
        phone = resume.get("summary", {}).get("phone", "+1 (555) 019-2834")
        return {
            "cover_letter": f"Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position. With a robust background in building scalable FastAPI microservices and interactive Next.js layouts, I am confident in my ability to immediately add value to your engineering team.\n\nIn my previous roles, I have consistently optimized database workflows and written tailored interfaces that improve client engagement. My master profile aligns perfectly with your requirements, and I am excited about the opportunity to build premium AI tools at your company.\n\nThank you for your time and consideration. I look forward to discussing my qualifications in more detail.\n\nSincerely,\n{name}\n{email}\n{phone}",
            "linkedin_dm": f"Hi [Recruiter Name],\n\nI hope you are doing well! I recently saw the Software Engineer opening on your team and wanted to reach out. With my experience in FastAPI, Next.js, and RAG architectures, I believe my background fits the role perfectly. I have attached my resume and would love to request a brief referral or chat if you have a moment. Thanks!\n\nBest,\n{name}",
            "application_email": f"Subject: Application for Software Engineer - {name}\n\nDear Hiring Team,\n\nPlease find attached my resume for the open Software Engineer position.\n\nHaving worked extensively with Python/FastAPI, Next.js, and vector databases (Qdrant), I am thrilled by your team's mission. I have a track record of building performant, user-friendly, and modern web applications.\n\nI would love the opportunity to interview and discuss how I can contribute. Thank you for your review.\n\nBest regards,\n\n{name}\n{email}\n{phone}\n{resume.get('summary', {}).get('linkedin', '')}"
        }

    def _generate_mock_interview_questions(self, resume: Dict[str, Any], jd: str) -> Dict[str, Any]:
        return {
            "technical_questions": [
                {
                    "question": "What is the difference between SQLite and PostgreSQL in terms of concurrency, and when should you migrate?",
                    "hint": "Talk about SQLite's database-level locking during writes vs. PostgreSQL's row-level locking and multi-version concurrency control (MVCC)."
                },
                {
                    "question": "How do you implement dependency injection in FastAPI, and why is it useful?",
                    "hint": "FastAPI uses the 'Depends' syntax. It is useful for database session management, auth middleware, and mocking dependencies during testing."
                }
            ],
            "behavioral_questions": [
                {
                    "question": "Tell me about a time you had to balance page speed performance with complex features in a React/Next.js application.",
                    "hint": "Use the STAR method. Describe the situation, explain dynamic imports/lazy loading (React.lazy or next/dynamic) and state optimization, and finish with performance metrics."
                }
            ],
            "system_design_questions": [
                {
                    "question": "Design a system to handle high-throughput CV parsing and vector indexing for 100,000 resumes daily.",
                    "hint": "Design an event-driven architecture using message queues (RabbitMQ/Kafka), asynchronous celery workers, file storage (S3), and scalable vector search databases (Qdrant clustering)."
                }
            ],
            "role_specific_questions": [
                {
                    "question": "Explain how a vector database searches for similar items and what role cosine similarity plays.",
                    "hint": "Talk about embeddings transforming words/paragraphs into high-dimensional vectors, indexing mechanisms (like HNSW), and cosine similarity measuring the angle between vectors to check similarity."
                }
            ]
        }

llm_service = LLMService()
