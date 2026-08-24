import { MatchInsights, FollowUpTask } from "./types";

export interface ParsedJobInfo {
  company: string;
  role: string;
  location: string;
  salary: string;
  job_url?: string;
  notes?: string;
  match_insights: MatchInsights;
  suggested_tasks: FollowUpTask[];
}

const COMMON_SKILLS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Python", "FastAPI", "Django", "Node.js",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  "GraphQL", "REST APIs", "TailwindCSS", "CSS", "HTML5", "Git", "CI/CD", "Jest",
  "System Design", "Microservices", "LangChain", "OpenAI", "Vector DB", "Qdrant",
  "Distributed Systems", "SQL", "Linux", "Terraform", "Serverless"
];

export function parseJobText(rawText: string, sourceUrl?: string): ParsedJobInfo {
  const text = rawText.trim();
  let company = "";
  let role = "";
  let location = "Remote";
  let salary = "";

  // Try extracting from URL if provided
  if (sourceUrl) {
    try {
      const urlObj = new URL(sourceUrl);
      const hostParts = urlObj.hostname.replace("www.", "").split(".");
      if (hostParts.length > 0 && !["linkedin", "indeed", "glassdoor", "greenhouse", "lever"].includes(hostParts[0])) {
        company = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
      }
    } catch (e) {
      // Invalid URL format, ignore
    }
  }

  // 1. Role extraction heuristics
  const roleRegex = /(?:Title|Role|Position|Job Title|Seeking a|Looking for an?)\s*[:\-–]?\s*([A-Za-z0-9\s\/\-\+]+?)(?:\n|\.|\,|$)/i;
  const roleMatch = text.match(roleRegex);
  if (roleMatch && roleMatch[1] && roleMatch[1].trim().length < 60) {
    role = roleMatch[1].trim();
  } else {
    // Look for common titles in first few lines
    const titleKeywords = [
      "Senior Full Stack Engineer",
      "Full Stack Engineer",
      "Senior Software Engineer",
      "Software Engineer",
      "Staff Software Engineer",
      "Frontend Engineer",
      "Senior Frontend Developer",
      "Backend Engineer",
      "Senior Backend Engineer",
      "AI Engineer",
      "Machine Learning Engineer",
      "Data Scientist",
      "DevOps Engineer",
      "Cloud Architect",
      "Product Engineer",
      "Engineering Manager",
    ];
    for (const kw of titleKeywords) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(text)) {
        role = kw;
        break;
      }
    }
  }

  // 2. Company extraction heuristics if not yet set
  if (!company) {
    const companyRegex = /(?:Company|About|At|Join|Employer)\s*[:\-–]?\s*([A-Za-z0-9\s&]+?)(?:\n|\.|\,|$)/i;
    const compMatch = text.match(companyRegex);
    if (compMatch && compMatch[1] && compMatch[1].trim().length < 40) {
      company = compMatch[1].trim();
    } else {
      // Look at first line
      const firstLine = text.split("\n")[0].trim();
      if (firstLine.includes(" at ")) {
        const parts = firstLine.split(" at ");
        if (parts[1]) company = parts[1].split(/[\n,\-]/)[0].trim();
        if (!role && parts[0]) role = parts[0].trim();
      } else if (firstLine.includes(" - ")) {
        const parts = firstLine.split(" - ");
        if (parts.length === 2) {
          company = parts[0].trim();
          if (!role) role = parts[1].trim();
        }
      }
    }
  }

  // 3. Location extraction
  if (/remote/i.test(text)) {
    location = "Remote";
    if (/hybrid/i.test(text)) location = "Hybrid / Remote";
  } else if (/hybrid/i.test(text)) {
    location = "Hybrid";
  } else {
    const locMatch = text.match(/(?:Location|Based in|Office)\s*[:\-–]?\s*([A-Za-z0-9\s,\.]+?)(?:\n|$)/i);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].trim();
    }
  }

  // 4. Salary extraction
  const salaryRegex = /(\$[\d,]+(?:\s*-\s*\$[\d,]+|\s*k\b|\s*-\s*[\d]+k\b)?(?:\s*(?:per year|\/yr|\/year|\/mo|annually))?)/i;
  const salaryMatch = text.match(salaryRegex);
  if (salaryMatch) {
    salary = salaryMatch[1].trim();
  }

  // 5. Skills & Match Analysis
  const detectedSkills = COMMON_SKILLS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)
  );

  const matchedStrengths = detectedSkills.slice(0, 5);
  if (matchedStrengths.length === 0) {
    matchedStrengths.push("TypeScript", "React", "Python", "API Design");
  }

  const remainingSkills = COMMON_SKILLS.filter((s) => !detectedSkills.includes(s));
  const suggestedGaps = remainingSkills.slice(0, 2);

  // Score computation
  const baseScore = 78 + Math.min(matchedStrengths.length * 3, 18);
  const score = Math.min(Math.max(baseScore, 70), 98);

  const today = new Date().toISOString().split("T")[0];
  const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const suggestedTasks: FollowUpTask[] = [
    {
      id: `task-auto-1-${Date.now()}`,
      title: "Send tailored resume and follow-up on application status",
      due_date: followUpDate,
      completed: false,
    },
    {
      id: `task-auto-2-${Date.now()}`,
      title: `Review ${matchedStrengths[0] || "core"} system design questions`,
      due_date: today,
      completed: false,
    },
  ];

  return {
    company: company || "Target Company",
    role: role || "Software Engineer",
    location: location || "Remote",
    salary: salary || "$130,000 - $160,000",
    job_url: sourceUrl || "",
    notes: text.length > 300 ? text.slice(0, 300) + "..." : text,
    match_insights: {
      score,
      strengths: matchedStrengths,
      gaps: suggestedGaps,
      summary: `Targeted match score of ${score}% based on detected requirements in ${matchedStrengths.slice(0, 3).join(", ")}.`,
    },
    suggested_tasks: suggestedTasks,
  };
}
