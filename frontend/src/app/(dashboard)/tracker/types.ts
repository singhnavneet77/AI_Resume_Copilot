export type ApplicationStatus =
  | "Bookmarked"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type ApplicationPriority = "Low" | "Medium" | "High";

export interface FollowUpTask {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
  notes?: string;
}

export interface InterviewRound {
  id: string;
  round_name: string; // e.g. "Recruiter Screen", "Technical Interview", "System Design", "Hiring Manager"
  date: string;
  interviewer?: string;
  notes?: string;
  status: "Scheduled" | "Completed" | "Passed" | "Needs Follow-up";
}

export interface ContactPerson {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface MatchInsights {
  score: number; // 0 - 100
  strengths: string[];
  gaps: string[];
  summary?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  location: string; // e.g. "Remote", "San Francisco, CA (Hybrid)", "New York, NY"
  salary: string; // e.g. "$140,000 - $170,000"
  date_applied: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD
  job_url?: string;
  resume_version?: string; // e.g. "FullStack-AI-Resume-v2.pdf"
  notes?: string;
  job_description?: string;
  match_insights: MatchInsights;
  contact?: ContactPerson;
  tasks: FollowUpTask[];
  interview_rounds: InterviewRound[];
  created_at: string;
  updated_at: string;
}

export type ViewMode = "kanban" | "table";

export interface ColumnVisibility {
  company: boolean;
  role: boolean;
  status: boolean;
  priority: boolean;
  matchScore: boolean;
  location: boolean;
  salary: boolean;
  dateApplied: boolean;
  nextTask: boolean;
  actions: boolean;
}

export type SortField = "date_applied" | "company" | "role" | "match_score" | "salary" | "priority";
export type SortOrder = "asc" | "desc";
