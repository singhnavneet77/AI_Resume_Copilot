"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Edit3,
  FileText,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Download,
  Upload,
  RotateCcw,
  CheckSquare,
  Square,
  User,
  Mail,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  Percent,
  AlertTriangle,
  Award,
  Zap,
} from "lucide-react";

import {
  JobApplication,
  ApplicationStatus,
  ApplicationPriority,
  FollowUpTask,
  InterviewRound,
  ContactPerson,
  ViewMode,
  ColumnVisibility,
  SortField,
  SortOrder,
} from "./types";
import { INITIAL_APPLICATIONS } from "./sampleData";
import { parseJobText } from "./jobParser";

function LinkedinIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8Z" />
    </svg>
  );
}

const STORAGE_KEY = "ai_resume_copilot_tracker_v2";

const COLUMNS: {
  id: ApplicationStatus;
  title: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  gradient: string;
  emptyText: string;
}[] = [
  {
    id: "Bookmarked",
    title: "Wishlist / Saved",
    color: "text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    borderColor: "border-sky-500/30",
    gradient: "from-sky-500/10 to-transparent",
    emptyText: "No bookmarked positions. Save interesting jobs here.",
  },
  {
    id: "Applied",
    title: "Applied",
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/10 to-transparent",
    emptyText: "No pending applications submitted yet.",
  },
  {
    id: "Interviewing",
    title: "Interviewing",
    color: "text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    borderColor: "border-violet-500/30",
    gradient: "from-violet-500/10 to-transparent",
    emptyText: "No active interview processes in progress.",
  },
  {
    id: "Offer",
    title: "Offer Received",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/10 to-transparent",
    emptyText: "Final job offers will be celebrated here.",
  },
  {
    id: "Rejected",
    title: "Archived / Rejected",
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderColor: "border-rose-500/30",
    gradient: "from-rose-500/10 to-transparent",
    emptyText: "Archived and closed applications.",
  },
];

const STAGE_ORDER: ApplicationStatus[] = [
  "Bookmarked",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

export default function JobTrackerPage() {
  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [taskFilter, setTaskFilter] = useState<string>("ALL"); // ALL, PENDING, OVERDUE
  const [sortField, setSortField] = useState<SortField>("date_applied");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Table Column Visibility
  const [columnsVisible, setColumnsVisible] = useState<ColumnVisibility>({
    company: true,
    role: true,
    status: true,
    priority: true,
    matchScore: true,
    location: true,
    salary: true,
    dateApplied: true,
    nextTask: true,
    actions: true,
  });
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);

  // Drawer / Detail State
  const [activeDrawerAppId, setActiveDrawerAppId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "tasks" | "interviews" | "contact" | "notes">("overview");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"smart" | "manual">("smart");
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Smart Parser Input State
  const [smartInputText, setSmartInputText] = useState("");
  const [smartSourceUrl, setSmartSourceUrl] = useState("");

  // Form Fields
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formStatus, setFormStatus] = useState<ApplicationStatus>("Applied");
  const [formPriority, setFormPriority] = useState<ApplicationPriority>("Medium");
  const [formLocation, setFormLocation] = useState("Remote");
  const [formSalary, setFormSalary] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formJobUrl, setFormJobUrl] = useState("");
  const [formResumeVersion, setFormResumeVersion] = useState("Default Resume");
  const [formNotes, setFormNotes] = useState("");
  const [formJobDesc, setFormJobDesc] = useState("");
  const [formMatchScore, setFormMatchScore] = useState<number>(85);
  const [formStrengths, setFormStrengths] = useState<string>("React, TypeScript, Next.js");
  const [formGaps, setFormGaps] = useState<string>("Kubernetes");

  // New task in drawer state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // New interview round state
  const [newRoundName, setNewRoundName] = useState("Technical Interview");
  const [newRoundDate, setNewRoundDate] = useState("");
  const [newRoundInterviewer, setNewRoundInterviewer] = useState("");
  const [newRoundNotes, setNewRoundNotes] = useState("");

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
        } else {
          setApplications(INITIAL_APPLICATIONS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
        }
      } else {
        setApplications(INITIAL_APPLICATIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
      }
    } catch (e) {
      console.warn("Failed to read from localStorage, using initial sample data:", e);
      setApplications(INITIAL_APPLICATIONS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist to LocalStorage whenever applications change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }
  }, [applications, isLoaded]);

  // Active App for Drawer
  const activeApp = useMemo(() => {
    return applications.find((a) => a.id === activeDrawerAppId) || null;
  }, [applications, activeDrawerAppId]);

  // 3. Smart Parser Action
  const handleRunSmartParse = () => {
    if (!smartInputText.trim() && !smartSourceUrl.trim()) return;
    const parsed = parseJobText(smartInputText, smartSourceUrl);
    setFormCompany(parsed.company);
    setFormRole(parsed.role);
    setFormLocation(parsed.location);
    setFormSalary(parsed.salary);
    setFormJobUrl(parsed.job_url || smartSourceUrl);
    setFormNotes(parsed.notes || "");
    setFormJobDesc(smartInputText);
    setFormMatchScore(parsed.match_insights.score);
    setFormStrengths(parsed.match_insights.strengths.join(", "));
    setFormGaps(parsed.match_insights.gaps.join(", "));
    setModalMode("manual");
  };

  // 4. Modal Openers
  const openAddModal = (defaultStatus: ApplicationStatus = "Applied") => {
    setEditingAppId(null);
    setSmartInputText("");
    setSmartSourceUrl("");
    setFormCompany("");
    setFormRole("");
    setFormStatus(defaultStatus);
    setFormPriority("Medium");
    setFormLocation("Remote");
    setFormSalary("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDeadline("");
    setFormJobUrl("");
    setFormResumeVersion("FullStack_AI_Resume_v3.pdf");
    setFormNotes("");
    setFormJobDesc("");
    setFormMatchScore(88);
    setFormStrengths("TypeScript, React, API Design");
    setFormGaps("GraphQL");
    setModalMode("smart");
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAppId(app.id);
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormStatus(app.status);
    setFormPriority(app.priority || "Medium");
    setFormLocation(app.location || "Remote");
    setFormSalary(app.salary || "");
    setFormDate(app.date_applied || new Date().toISOString().split("T")[0]);
    setFormDeadline(app.deadline || "");
    setFormJobUrl(app.job_url || "");
    setFormResumeVersion(app.resume_version || "Default Resume");
    setFormNotes(app.notes || "");
    setFormJobDesc(app.job_description || "");
    setFormMatchScore(app.match_insights?.score || 85);
    setFormStrengths(app.match_insights?.strengths?.join(", ") || "");
    setFormGaps(app.match_insights?.gaps?.join(", ") || "");
    setModalMode("manual");
    setIsModalOpen(true);
  };

  // 5. Save Application
  const handleSaveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formRole.trim()) return;

    const strengthArray = formStrengths
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const gapArray = formGaps
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    if (editingAppId) {
      // Update existing
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === editingAppId) {
            return {
              ...app,
              company: formCompany.trim(),
              role: formRole.trim(),
              status: formStatus,
              priority: formPriority,
              location: formLocation.trim() || "Remote",
              salary: formSalary.trim(),
              date_applied: formDate,
              deadline: formDeadline || undefined,
              job_url: formJobUrl.trim() || undefined,
              resume_version: formResumeVersion.trim() || undefined,
              notes: formNotes.trim(),
              job_description: formJobDesc.trim(),
              match_insights: {
                score: formMatchScore,
                strengths: strengthArray,
                gaps: gapArray,
                summary: `Calculated match score of ${formMatchScore}% for ${formRole} at ${formCompany}.`,
              },
              updated_at: now,
            };
          }
          return app;
        })
      );
    } else {
      // Create new
      const defaultTasks: FollowUpTask[] = [
        {
          id: `task-${Date.now()}-1`,
          title: "Follow up on application status if no response in 5 days",
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          completed: false,
        },
      ];

      const newApp: JobApplication = {
        id: `app-${Date.now()}`,
        company: formCompany.trim(),
        role: formRole.trim(),
        status: formStatus,
        priority: formPriority,
        location: formLocation.trim() || "Remote",
        salary: formSalary.trim() || "$130k - $160k",
        date_applied: formDate || new Date().toISOString().split("T")[0],
        deadline: formDeadline || undefined,
        job_url: formJobUrl.trim() || undefined,
        resume_version: formResumeVersion.trim() || "FullStack_AI_Resume_v3.pdf",
        notes: formNotes.trim(),
        job_description: formJobDesc.trim(),
        match_insights: {
          score: formMatchScore,
          strengths: strengthArray.length > 0 ? strengthArray : ["Problem Solving", "Communication", "System Design"],
          gaps: gapArray,
          summary: `Calculated relevance score of ${formMatchScore}% for ${formRole}.`,
        },
        tasks: defaultTasks,
        interview_rounds: [],
        created_at: now,
        updated_at: now,
      };

      setApplications((prev) => [newApp, ...prev]);
    }

    setIsModalOpen(false);
  };

  // 6. Delete Application
  const handleDeleteApp = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this job application?")) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (activeDrawerAppId === id) setActiveDrawerAppId(null);
    }
  };

  // 7. Move Stage
  const handleUpdateStatus = (appId: string, newStatus: ApplicationStatus, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e && "stopPropagation" in e) e.stopPropagation();
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a
      )
    );
  };

  const moveLeft = (app: JobApplication, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = STAGE_ORDER.indexOf(app.status);
    if (idx > 0) {
      handleUpdateStatus(app.id, STAGE_ORDER[idx - 1]);
    }
  };

  const moveRight = (app: JobApplication, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = STAGE_ORDER.indexOf(app.status);
    if (idx < STAGE_ORDER.length - 1) {
      handleUpdateStatus(app.id, STAGE_ORDER[idx + 1]);
    }
  };

  // 8. Task Management in Active App
  const handleToggleTask = (appId: string, taskId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const updatedTasks = app.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          );
          return { ...app, tasks: updatedTasks, updated_at: new Date().toISOString() };
        }
        return app;
      })
    );
  };

  const handleAddTask = (appId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: FollowUpTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || new Date().toISOString().split("T")[0],
      completed: false,
    };
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: [...app.tasks, newTask],
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  const handleDeleteTask = (appId: string, taskId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: app.tasks.filter((t) => t.id !== taskId),
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  // 9. Interview Rounds Management
  const handleAddInterviewRound = (appId: string) => {
    if (!newRoundName.trim()) return;
    const newRound: InterviewRound = {
      id: `round-${Date.now()}`,
      round_name: newRoundName.trim(),
      date: newRoundDate || new Date().toISOString().split("T")[0],
      interviewer: newRoundInterviewer.trim() || undefined,
      notes: newRoundNotes.trim() || undefined,
      status: "Scheduled",
    };
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            interview_rounds: [...app.interview_rounds, newRound],
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
    setNewRoundName("Technical Interview");
    setNewRoundDate("");
    setNewRoundInterviewer("");
    setNewRoundNotes("");
  };

  const handleDeleteInterviewRound = (appId: string, roundId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            interview_rounds: app.interview_rounds.filter((r) => r.id !== roundId),
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  const handleUpdateRoundStatus = (appId: string, roundId: string, status: InterviewRound["status"]) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            interview_rounds: app.interview_rounds.map((r) =>
              r.id === roundId ? { ...r, status } : r
            ),
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  // 10. Contact Person update in active app
  const handleUpdateContact = (appId: string, field: keyof ContactPerson, val: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const updatedContact: ContactPerson = {
            ...(app.contact || { name: "" }),
            [field]: val,
          };
          return { ...app, contact: updatedContact, updated_at: new Date().toISOString() };
        }
        return app;
      })
    );
  };

  // 11. Recalculate / Boost Match Simulation
  const handleSimulateMatchBoost = (appId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const boostedScore = Math.min(99, (app.match_insights?.score || 80) + 7);
          const newStrengths = [
            ...(app.match_insights?.strengths || []),
            "ATS Optimized Keywords",
            "Tailored Metrics",
          ].slice(0, 7);
          return {
            ...app,
            match_insights: {
              ...app.match_insights,
              score: boostedScore,
              strengths: Array.from(new Set(newStrengths)),
              summary: `Re-calculated with targeted resume keywords. Match increased to ${boostedScore}%.`,
            },
            updated_at: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  // 12. Export Data (CSV & JSON)
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applications, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `job_tracker_export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = [
      "Company",
      "Role",
      "Status",
      "Priority",
      "Match Score",
      "Location",
      "Salary",
      "Date Applied",
      "Job URL",
      "Tasks Count",
      "Notes",
    ];

    const rows = applications.map((a) => [
      `"${a.company.replace(/"/g, '""')}"`,
      `"${a.role.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.priority}"`,
      `"${a.match_insights?.score || 0}%"`,
      `"${(a.location || "").replace(/"/g, '""')}"`,
      `"${(a.salary || "").replace(/"/g, '""')}"`,
      `"${a.date_applied || ""}"`,
      `"${(a.job_url || "").replace(/"/g, '""')}"`,
      `"${a.tasks?.filter((t) => !t.completed).length || 0} pending"`,
      `"${(a.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `job_tracker_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 13. Import Data
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setApplications(parsed);
            alert(`Successfully imported ${parsed.length} applications from JSON.`);
          } else {
            alert("Invalid JSON format. Expected an array of job applications.");
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter((l) => l.trim().length > 0);
          if (lines.length <= 1) {
            alert("CSV appears empty or has only headers.");
            return;
          }
          const importedApps: JobApplication[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            if (cols[0] && cols[1]) {
              importedApps.push({
                id: `import-${Date.now()}-${i}`,
                company: cols[0] || "Imported Company",
                role: cols[1] || "Software Engineer",
                status: (cols[2] as ApplicationStatus) || "Applied",
                priority: (cols[3] as ApplicationPriority) || "Medium",
                match_insights: {
                  score: parseInt(cols[4]) || 85,
                  strengths: ["General Skills"],
                  gaps: [],
                },
                location: cols[5] || "Remote",
                salary: cols[6] || "",
                date_applied: cols[7] || new Date().toISOString().split("T")[0],
                job_url: cols[8] || "",
                notes: cols[10] || "",
                tasks: [],
                interview_rounds: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
          if (importedApps.length > 0) {
            setApplications((prev) => [...importedApps, ...prev]);
            alert(`Imported ${importedApps.length} applications from CSV.`);
          }
        }
      } catch (err) {
        alert("Failed to parse the imported file: " + String(err));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 14. Reset to Demo Data
  const handleResetData = () => {
    if (confirm("Reset tracker to default sample applications? This will replace current items.")) {
      setApplications(INITIAL_APPLICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    }
  };

  // 15. Filtering & Sorting computation
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = app.company.toLowerCase().includes(q);
          const matchRole = app.role.toLowerCase().includes(q);
          const matchLocation = app.location?.toLowerCase().includes(q);
          const matchNotes = app.notes?.toLowerCase().includes(q);
          const matchSkills = app.match_insights?.strengths?.some((s) => s.toLowerCase().includes(q));
          const matchContact = app.contact?.name?.toLowerCase().includes(q);
          if (!matchCompany && !matchRole && !matchLocation && !matchNotes && !matchSkills && !matchContact) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter !== "ALL" && app.status !== statusFilter) {
          return false;
        }

        // Priority Filter
        if (priorityFilter !== "ALL" && app.priority !== priorityFilter) {
          return false;
        }

        // Task filter
        if (taskFilter === "PENDING") {
          const hasPending = app.tasks.some((t) => !t.completed);
          if (!hasPending) return false;
        } else if (taskFilter === "OVERDUE") {
          const hasOverdue = app.tasks.some((t) => !t.completed && t.due_date && t.due_date < todayStr);
          if (!hasOverdue) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "date_applied") {
          cmp = (a.date_applied || "").localeCompare(b.date_applied || "");
        } else if (sortField === "company") {
          cmp = a.company.localeCompare(b.company);
        } else if (sortField === "role") {
          cmp = a.role.localeCompare(b.role);
        } else if (sortField === "match_score") {
          cmp = (a.match_insights?.score || 0) - (b.match_insights?.score || 0);
        } else if (sortField === "priority") {
          const pOrder = { High: 3, Medium: 2, Low: 1 };
          cmp = (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [applications, searchQuery, statusFilter, priorityFilter, taskFilter, sortField, sortOrder, todayStr]);

  // Top Metrics Calculation
  const totalAppsCount = applications.length;
  const activePipelineCount = applications.filter((a) => a.status === "Applied" || a.status === "Interviewing").length;
  const interviewCount = applications.filter((a) => a.status === "Interviewing").length;
  const offerCount = applications.filter((a) => a.status === "Offer").length;
  const interviewRate = totalAppsCount > 0 ? Math.round(((interviewCount + offerCount) / totalAppsCount) * 100) : 0;
  const avgMatchScore =
    totalAppsCount > 0
      ? Math.round(applications.reduce((acc, curr) => acc + (curr.match_insights?.score || 80), 0) / totalAppsCount)
      : 0;

  const totalPendingTasks = applications.reduce((acc, app) => {
    return acc + app.tasks.filter((t) => !t.completed).length;
  }, 0);

  const overdueTasksCount = applications.reduce((acc, app) => {
    return acc + app.tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr).length;
  }, 0);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Initializing Job Application Tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <Briefcase className="w-7 h-7 text-violet-400" />
              <span>Job Application Tracker</span>
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Local Sync Active
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Track applications, manage multi-round interviews, follow up on time, and analyze relevance scores.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Import / Export Menu */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              title="Export as CSV"
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              title="Export as JSON"
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <label
              title="Import CSV or JSON"
              className="cursor-pointer p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Import</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            <button
              onClick={handleResetData}
              title="Reset to sample data"
              className="p-2 text-slate-400 hover:text-amber-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Add Job Button */}
          <button
            onClick={() => openAddModal("Applied")}
            className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Tracked</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold text-white mt-1.5">{totalAppsCount}</p>
          <span className="text-[11px] text-slate-500">All submissions</span>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">In Pipeline</span>
            <Flame className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-200 mt-1.5">{activePipelineCount}</p>
          <span className="text-[11px] text-blue-400/70">Applied + Interviewing</span>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Interview Rate</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-xl font-bold text-violet-200 mt-1.5">{interviewRate}%</p>
          <span className="text-[11px] text-violet-400/70">{interviewCount} active rounds</span>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Offers</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-300 mt-1.5">{offerCount}</p>
          <span className="text-[11px] text-emerald-400/70">Celebration stage</span>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Avg Match</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-indigo-200 mt-1.5">{avgMatchScore}%</p>
          <span className="text-[11px] text-indigo-400/70">Skill relevance</span>
        </div>

        <div
          className={`glass-panel p-3.5 rounded-xl border col-span-2 sm:col-span-1 ${
            overdueTasksCount > 0
              ? "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent"
              : "border-slate-800/80 bg-slate-900/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Tasks Due</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-200 mt-1.5">{totalPendingTasks}</p>
          <span className="text-[11px] text-amber-400/70">
            {overdueTasksCount > 0 ? `${overdueTasksCount} overdue!` : "All on schedule"}
          </span>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search company, role, location, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              {STAGE_ORDER.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Tasks Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Tasks:</span>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tasks</option>
              <option value="PENDING">Has Pending Tasks</option>
              <option value="OVERDUE">Has Overdue Tasks</option>
            </select>
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="date_applied">Date Applied</option>
              <option value="match_score">Match Score</option>
              <option value="company">Company</option>
              <option value="priority">Priority</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="text-[10px] text-violet-400 font-bold hover:text-violet-300 ml-1 px-1 rounded bg-violet-500/10"
              title="Toggle sort order"
            >
              {sortOrder === "asc" ? "ASC" : "DESC"}
            </button>
          </div>

          {/* Table Column Toggle (Only visible in table view) */}
          {viewMode === "table" && (
            <div className="relative">
              <button
                onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Columns</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isColMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-30 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                    Visible Columns
                  </div>
                  {Object.entries(columnsVisible).map(([key, isVis]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
                    >
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <input
                        type="checkbox"
                        checked={isVis}
                        onChange={(e) =>
                          setColumnsVisible((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-700 text-violet-600 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colApps = filteredApplications.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className="glass-panel rounded-2xl border border-slate-800/80 flex flex-col min-h-[550px] overflow-hidden bg-slate-950/40"
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 border-b border-slate-800/90 flex items-center justify-between bg-gradient-to-b ${col.gradient}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                      {col.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${col.badgeBg}`}>
                      {colApps.length}
                    </span>
                    <button
                      onClick={() => openAddModal(col.id)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                      title={`Add job to ${col.title}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[780px]">
                  {colApps.length === 0 ? (
                    <div className="text-center py-12 px-3 border border-dashed border-slate-800/80 rounded-xl">
                      <p className="text-xs text-slate-500 leading-relaxed">{col.emptyText}</p>
                      <button
                        onClick={() => openAddModal(col.id)}
                        className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Job
                      </button>
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const pendingTasks = app.tasks.filter((t) => !t.completed);
                      const hasOverdue = app.tasks.some(
                        (t) => !t.completed && t.due_date && t.due_date < todayStr
                      );
                      const matchScore = app.match_insights?.score || 80;

                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            setActiveDrawerAppId(app.id);
                            setDrawerTab("overview");
                          }}
                          className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-xl p-3.5 space-y-2.5 shadow-md hover:shadow-xl transition-all relative overflow-hidden cursor-pointer"
                        >
                          {/* Priority / Top Color Strip */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 ${
                              app.priority === "High"
                                ? "bg-rose-500"
                                : app.priority === "Medium"
                                ? "bg-amber-500"
                                : "bg-slate-600"
                            }`}
                          />

                          {/* Company, Role & Actions */}
                          <div className="flex items-start justify-between gap-2 pt-0.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider truncate">
                                  {app.company}
                                </span>
                                {app.priority === "High" && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                                    HIGH
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors mt-0.5">
                                {app.role}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {app.job_url && (
                                <a
                                  href={app.job_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 text-slate-400 hover:text-violet-400 rounded-md hover:bg-slate-800 transition-all"
                                  title="Open Job Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={(e) => openEditModal(app, e)}
                                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteApp(app.id, e)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Match Score & Location */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  matchScore >= 90
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : matchScore >= 80
                                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {matchScore}% Match
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {app.location || "Remote"}
                            </span>
                          </div>

                          {/* Salary & Date Tags */}
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {app.salary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                <DollarSign className="w-3 h-3 text-emerald-500" />
                                <span>{app.salary}</span>
                              </span>
                            )}
                            {app.date_applied && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{app.date_applied}</span>
                              </span>
                            )}
                          </div>

                          {/* Tasks & Reminders Indicator */}
                          {app.tasks.length > 0 && (
                            <div
                              className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                                hasOverdue
                                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                                  : pendingTasks.length > 0
                                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                                  : "bg-slate-800/40 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {hasOverdue ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                ) : (
                                  <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                                <span className="truncate text-[11px]">
                                  {pendingTasks[0]?.title || "All follow-ups completed"}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold shrink-0 ml-1">
                                {app.tasks.filter((t) => t.completed).length}/{app.tasks.length}
                              </span>
                            </div>
                          )}

                          {/* Interview Rounds Indicator */}
                          {app.interview_rounds.length > 0 && (
                            <div className="text-[11px] text-violet-300 flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/20">
                              <Flame className="w-3 h-3 text-violet-400" />
                              <span>{app.interview_rounds.length} Interview Round(s)</span>
                            </div>
                          )}

                          {/* Quick Stage Controls */}
                          <div
                            className="pt-2 border-t border-slate-800/60 flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => moveLeft(app, e)}
                              disabled={STAGE_ORDER.indexOf(app.status) === 0}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-all rounded hover:bg-slate-800"
                              title="Move stage left"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleUpdateStatus(app.id, e.target.value as ApplicationStatus, e)
                              }
                              className="text-[10px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500 font-medium cursor-pointer"
                            >
                              {STAGE_ORDER.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={(e) => moveRight(app, e)}
                              disabled={STAGE_ORDER.indexOf(app.status) === STAGE_ORDER.length - 1}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-all rounded hover:bg-slate-800"
                              title="Move stage right"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= SPREADSHEET / TABLE VIEW ================= */
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {columnsVisible.company && <th className="p-3.5">Company</th>}
                  {columnsVisible.role && <th className="p-3.5">Role Title</th>}
                  {columnsVisible.status && <th className="p-3.5">Stage</th>}
                  {columnsVisible.priority && <th className="p-3.5">Priority</th>}
                  {columnsVisible.matchScore && <th className="p-3.5">Match %</th>}
                  {columnsVisible.location && <th className="p-3.5">Location</th>}
                  {columnsVisible.salary && <th className="p-3.5">Compensation</th>}
                  {columnsVisible.dateApplied && <th className="p-3.5">Applied Date</th>}
                  {columnsVisible.nextTask && <th className="p-3.5">Next Task / Follow-Up</th>}
                  {columnsVisible.actions && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      No applications found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => {
                    const pendingTasks = app.tasks.filter((t) => !t.completed);
                    const hasOverdue = app.tasks.some(
                      (t) => !t.completed && t.due_date && t.due_date < todayStr
                    );
                    const matchScore = app.match_insights?.score || 80;

                    return (
                      <tr
                        key={app.id}
                        onClick={() => {
                          setActiveDrawerAppId(app.id);
                          setDrawerTab("overview");
                        }}
                        className="hover:bg-slate-900/80 transition-colors cursor-pointer group"
                      >
                        {columnsVisible.company && (
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                            <span>{app.company}</span>
                          </td>
                        )}

                        {columnsVisible.role && (
                          <td className="p-3.5 font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                            {app.role}
                          </td>
                        )}

                        {columnsVisible.status && (
                          <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleUpdateStatus(app.id, e.target.value as ApplicationStatus, e)
                              }
                              className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500 font-medium cursor-pointer"
                            >
                              {STAGE_ORDER.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        {columnsVisible.priority && (
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                app.priority === "High"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : app.priority === "Medium"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {app.priority}
                            </span>
                          </td>
                        )}

                        {columnsVisible.matchScore && (
                          <td className="p-3.5">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                matchScore >= 90
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : matchScore >= 80
                                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {matchScore}%
                            </span>
                          </td>
                        )}

                        {columnsVisible.location && (
                          <td className="p-3.5 text-slate-400">
                            {app.location || "Remote"}
                          </td>
                        )}

                        {columnsVisible.salary && (
                          <td className="p-3.5 text-emerald-400 font-medium">
                            {app.salary || "—"}
                          </td>
                        )}

                        {columnsVisible.dateApplied && (
                          <td className="p-3.5 text-slate-400">
                            {app.date_applied || "—"}
                          </td>
                        )}

                        {columnsVisible.nextTask && (
                          <td className="p-3.5">
                            {pendingTasks.length > 0 ? (
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                  hasOverdue
                                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                }`}
                              >
                                {hasOverdue && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                                <span className="max-w-[160px] truncate">{pendingTasks[0]?.title}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">All clear</span>
                            )}
                          </td>
                        )}

                        {columnsVisible.actions && (
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1.5">
                              {app.job_url && (
                                <a
                                  href={app.job_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-violet-400 rounded-lg hover:bg-slate-800 transition-all"
                                  title="Job Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={(e) => openEditModal(app, e)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteApp(app.id, e)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 360° SLIDE-OVER APPLICATION DRAWER ================= */}
      {activeApp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                      {activeApp.company}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        activeApp.priority === "High"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : activeApp.priority === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {activeApp.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeApp.role}</h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => openEditModal(activeApp, e)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setActiveDrawerAppId(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stage Quick Switcher */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                {STAGE_ORDER.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(activeApp.id, st)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                      activeApp.status === st
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-2 mt-5 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <button
                  onClick={() => setDrawerTab("overview")}
                  className={`pb-2 px-2 border-b-2 transition-all ${
                    drawerTab === "overview"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent hover:text-white"
                  }`}
                >
                  Overview & Match
                </button>
                <button
                  onClick={() => setDrawerTab("tasks")}
                  className={`pb-2 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
                    drawerTab === "tasks"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent hover:text-white"
                  }`}
                >
                  <span>Follow-Up Tasks</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                    {activeApp.tasks.filter((t) => !t.completed).length}
                  </span>
                </button>
                <button
                  onClick={() => setDrawerTab("interviews")}
                  className={`pb-2 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
                    drawerTab === "interviews"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent hover:text-white"
                  }`}
                >
                  <span>Interviews</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                    {activeApp.interview_rounds.length}
                  </span>
                </button>
                <button
                  onClick={() => setDrawerTab("contact")}
                  className={`pb-2 px-2 border-b-2 transition-all ${
                    drawerTab === "contact"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent hover:text-white"
                  }`}
                >
                  Recruiter / Contacts
                </button>
                <button
                  onClick={() => setDrawerTab("notes")}
                  className={`pb-2 px-2 border-b-2 transition-all ${
                    drawerTab === "notes"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent hover:text-white"
                  }`}
                >
                  Notes
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 flex-1 space-y-6">
              {/* TAB 1: OVERVIEW & MATCH */}
              {drawerTab === "overview" && (
                <div className="space-y-6">
                  {/* Match Score Card */}
                  <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-violet-400" />
                        <h3 className="text-sm font-bold text-white">Relevance & Match Insights</h3>
                      </div>
                      <button
                        onClick={() => handleSimulateMatchBoost(activeApp.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1 transition-all shadow-md shadow-violet-600/20"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Optimize Match</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="text-3xl font-black text-white">
                        {activeApp.match_insights?.score || 85}%
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${activeApp.match_insights?.score || 85}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          {activeApp.match_insights?.summary ||
                            "Strong candidate match based on core skills."}
                        </p>
                      </div>
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                          Key Strengths Matched
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {activeApp.match_insights?.strengths?.map((st, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                            >
                              ✓ {st}
                            </span>
                          ))}
                        </div>
                      </div>

                      {activeApp.match_insights?.gaps && activeApp.match_insights.gaps.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                            Recommended Additions / Gaps
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {activeApp.match_insights.gaps.map((gap, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                              >
                                ! {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Location
                      </span>
                      <p className="text-sm font-medium text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeApp.location || "Remote"}</span>
                      </p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Compensation
                      </span>
                      <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{activeApp.salary || "Not Specified"}</span>
                      </p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Date Applied
                      </span>
                      <p className="text-sm font-medium text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeApp.date_applied || "—"}</span>
                      </p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Resume Version
                      </span>
                      <p className="text-sm font-medium text-violet-300 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-violet-400" />
                        <span className="truncate">{activeApp.resume_version || "Default"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Job Posting URL */}
                  {activeApp.job_url && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{activeApp.job_url}</span>
                      </div>
                      <a
                        href={activeApp.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Open Posting</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TASKS & FOLLOW-UPS */}
              {drawerTab === "tasks" && (
                <div className="space-y-4">
                  {/* Add Task Box */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Add Follow-Up Task
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Send thank you note to recruiter..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddTask(activeApp.id)}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all shrink-0"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2">
                    {activeApp.tasks.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        No follow-up tasks created yet. Add one above!
                      </p>
                    ) : (
                      activeApp.tasks.map((task) => {
                        const isOverdue = !task.completed && task.due_date && task.due_date < todayStr;
                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              task.completed
                                ? "bg-slate-900/40 border-slate-800/50 opacity-60"
                                : isOverdue
                                ? "bg-rose-500/10 border-rose-500/20"
                                : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <button
                                onClick={() => handleToggleTask(activeApp.id, task.id)}
                                className="text-slate-400 hover:text-violet-400 transition-colors"
                              >
                                {task.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <p
                                  className={`text-xs font-medium ${
                                    task.completed ? "line-through text-slate-500" : "text-slate-200"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                {task.due_date && (
                                  <span
                                    className={`text-[10px] ${
                                      isOverdue ? "text-rose-400 font-bold" : "text-slate-500"
                                    }`}
                                  >
                                    Due: {task.due_date} {isOverdue && "(Overdue)"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTask(activeApp.id, task.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INTERVIEW ROUNDS */}
              {drawerTab === "interviews" && (
                <div className="space-y-4">
                  {/* Add Interview Round */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Log Interview Round
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Round Title (e.g. System Design)"
                        value={newRoundName}
                        onChange={(e) => setNewRoundName(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="date"
                        value={newRoundDate}
                        onChange={(e) => setNewRoundDate(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Interviewer Name / Role"
                        value={newRoundInterviewer}
                        onChange={(e) => setNewRoundInterviewer(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Key Notes & Feedback"
                        value={newRoundNotes}
                        onChange={(e) => setNewRoundNotes(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleAddInterviewRound(activeApp.id)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      Log Interview Round
                    </button>
                  </div>

                  {/* Interview Timeline */}
                  <div className="space-y-3">
                    {activeApp.interview_rounds.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">
                        No interview rounds recorded yet.
                      </p>
                    ) : (
                      activeApp.interview_rounds.map((round, idx) => (
                        <div
                          key={round.id}
                          className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-white">{round.round_name}</h4>
                            </div>

                            <div className="flex items-center space-x-2">
                              <select
                                value={round.status}
                                onChange={(e) =>
                                  handleUpdateRoundStatus(
                                    activeApp.id,
                                    round.id,
                                    e.target.value as InterviewRound["status"]
                                  )
                                }
                                className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Passed">Passed</option>
                                <option value="Needs Follow-up">Needs Follow-up</option>
                              </select>
                              <button
                                onClick={() => handleDeleteInterviewRound(activeApp.id, round.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                            {round.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{round.date}</span>
                              </span>
                            )}
                            {round.interviewer && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>{round.interviewer}</span>
                              </span>
                            )}
                          </div>

                          {round.notes && (
                            <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                              {round.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: RECRUITER & CONTACTS */}
              {drawerTab === "contact" && (
                <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-400" />
                      <span>Recruiter / Hiring Contact Information</span>
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={activeApp.contact?.name || ""}
                          onChange={(e) => handleUpdateContact(activeApp.id, "name", e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={activeApp.contact?.role || ""}
                          onChange={(e) => handleUpdateContact(activeApp.id, "role", e.target.value)}
                          placeholder="e.g. Senior Technical Recruiter"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Email Address
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={activeApp.contact?.email || ""}
                            onChange={(e) => handleUpdateContact(activeApp.id, "email", e.target.value)}
                            placeholder="e.g. recruiter@company.com"
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                          />
                          {activeApp.contact?.email && (
                            <a
                              href={`mailto:${activeApp.contact.email}`}
                              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          LinkedIn Profile URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={activeApp.contact?.linkedin || ""}
                            onChange={(e) => handleUpdateContact(activeApp.id, "linkedin", e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                          />
                          {activeApp.contact?.linkedin && (
                            <a
                              href={activeApp.contact.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                            >
                              <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" />
                              <span>View</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTES */}
              {drawerTab === "notes" && (
                <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-white">Interview Logs & Internal Notes</h3>
                    <textarea
                      rows={8}
                      value={activeApp.notes || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApplications((prev) =>
                          prev.map((a) => (a.id === activeApp.id ? { ...a, notes: val } : a))
                        );
                      }}
                      placeholder="Add interview feedback, questions asked, team culture notes, salary negotiations..."
                      className="w-full p-3.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-slate-200 focus:outline-none leading-relaxed font-sans"
                    />
                  </div>

                  {activeApp.job_description && (
                    <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-sm font-bold text-white">Original Job Description</h3>
                      <div className="max-h-60 overflow-y-auto p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {activeApp.job_description}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD / EDIT JOB MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-violet-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingAppId ? "Edit Job Application" : "Add Job Application"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher (only for new job) */}
            {!editingAppId && (
              <div className="flex border-b border-slate-800 bg-slate-900/40 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode("smart")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    modalMode === "smart"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                  <span>Smart Auto-Fill from JD / URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("manual")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    modalMode === "manual"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manual Form Entry</span>
                </button>
              </div>
            )}

            {/* SMART AUTO-FILL TAB */}
            {modalMode === "smart" && !editingAppId ? (
              <div className="p-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 leading-relaxed">
                  Paste a job description text or posting link. The tracker will extract the company name, role, compensation, and calculate instant match relevance!
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Job Posting Link / URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/jobs/view/..."
                    value={smartSourceUrl}
                    onChange={(e) => setSmartSourceUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Raw Job Description Text
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Paste the full job description or key snippet here..."
                    value={smartInputText}
                    onChange={(e) => setSmartInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalMode("manual")}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Skip to Manual Form
                  </button>
                  <button
                    type="button"
                    onClick={handleRunSmartParse}
                    disabled={!smartInputText.trim() && !smartSourceUrl.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-violet-500/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Fill & Review</span>
                  </button>
                </div>
              </div>
            ) : (
              /* MANUAL FORM TAB */
              <form onSubmit={handleSaveApplication} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stripe, Google, Anthropic"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Role Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Software Engineer"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Stage
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {STAGE_ORDER.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as ApplicationPriority)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Remote / City"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Salary / Comp
                    </label>
                    <input
                      type="text"
                      placeholder="$140,000 - $170,000"
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Date Applied
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Match Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formMatchScore}
                      onChange={(e) => setFormMatchScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Job Link / Posting URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com/careers/..."
                    value={formJobUrl}
                    onChange={(e) => setFormJobUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Key Strengths (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="React, TypeScript, Python, FastAPI"
                      value={formStrengths}
                      onChange={(e) => setFormStrengths(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Skills Gaps (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Kubernetes, GraphQL"
                      value={formGaps}
                      onChange={(e) => setFormGaps(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Notes & Interview Preparation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Notes on referral, hiring manager, interview preparation questions..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-xl text-xs text-white focus:outline-none font-sans"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-violet-500/20"
                  >
                    {editingAppId ? "Save Changes" : "Save Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
