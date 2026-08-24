"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  Layers,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
  Edit3,
  FileText,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export type ApplicationStatus = "Applied" | "Assessment" | "Interview" | "Offer" | "Rejected";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  location?: string;
  salary?: string;
  date_applied?: string;
  job_url?: string;
  notes?: string;
  next_step?: string;
}

const COLUMNS: {
  id: ApplicationStatus;
  title: string;
  icon: any;
  color: string;
  badgeBg: string;
  borderColor: string;
  gradient: string;
  emptyText: string;
}[] = [
  {
    id: "Applied",
    title: "Applied",
    icon: SendIcon,
    color: "text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    borderColor: "border-sky-500/30",
    gradient: "from-sky-500/10 to-transparent",
    emptyText: "No active applications here. Click '+ Add Job' to track one!",
  },
  {
    id: "Assessment",
    title: "Assessment",
    icon: Code2Icon,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/10 to-transparent",
    emptyText: "No online assessments or take-home tests pending.",
  },
  {
    id: "Interview",
    title: "Interview Round",
    icon: Flame,
    color: "text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    borderColor: "border-violet-500/30",
    gradient: "from-violet-500/10 to-transparent",
    emptyText: "No scheduled interview rounds.",
  },
  {
    id: "Offer",
    title: "Final Offer",
    icon: TrophyIcon,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/10 to-transparent",
    emptyText: "Keep going! Your offers will celebrate here.",
  },
  {
    id: "Rejected",
    title: "Rejection / Archive",
    icon: XCircle,
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderColor: "border-rose-500/30",
    gradient: "from-rose-500/10 to-transparent",
    emptyText: "No rejected applications archived.",
  },
];

function SendIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );
}

function Code2Icon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"></path>
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path>
    </svg>
  );
}

export default function JobTrackerPage() {
  const { apiFetch } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Form State
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formStatus, setFormStatus] = useState<ApplicationStatus>("Applied");
  const [formLocation, setFormLocation] = useState("Remote");
  const [formSalary, setFormSalary] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formJobUrl, setFormJobUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formNextStep, setFormNextStep] = useState("");

  // Load from API + localStorage backup
  useEffect(() => {
    async function loadTracker() {
      try {
        const data = await apiFetch("/tracker");
        if (Array.isArray(data)) {
          setApplications(data);
          localStorage.setItem("job_tracker_cache", JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Could not fetch remote tracker data, using local cache:", err);
        const cached = localStorage.getItem("job_tracker_cache");
        if (cached) {
          try {
            setApplications(JSON.parse(cached));
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    }
    loadTracker();
  }, []);

  const openAddModal = (defaultStatus: ApplicationStatus = "Applied") => {
    setEditingApp(null);
    setFormCompany("");
    setFormRole("");
    setFormStatus(defaultStatus);
    setFormLocation("Remote");
    setFormSalary("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormJobUrl("");
    setFormNotes("");
    setFormNextStep("");
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormStatus(app.status);
    setFormLocation(app.location || "Remote");
    setFormSalary(app.salary || "");
    setFormDate(app.date_applied || new Date().toISOString().split("T")[0]);
    setFormJobUrl(app.job_url || "");
    setFormNotes(app.notes || "");
    setFormNextStep(app.next_step || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formRole) return;

    const payload = {
      company: formCompany.trim(),
      role: formRole.trim(),
      status: formStatus,
      location: formLocation.trim() || "Remote",
      salary: formSalary.trim(),
      date_applied: formDate,
      job_url: formJobUrl.trim(),
      notes: formNotes.trim(),
      next_step: formNextStep.trim(),
    };

    try {
      if (editingApp) {
        // Update existing
        const updated = await apiFetch(`/tracker/${editingApp.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        const nextList = applications.map((a) => (a.id === editingApp.id ? { ...a, ...payload } : a));
        setApplications(nextList);
        localStorage.setItem("job_tracker_cache", JSON.stringify(nextList));
      } else {
        // Create new
        const created = await apiFetch("/tracker", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const nextList = [created, ...applications];
        setApplications(nextList);
        localStorage.setItem("job_tracker_cache", JSON.stringify(nextList));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      // Local fallback in case backend is offline
      const tempId = editingApp ? editingApp.id : `job_${Date.now()}`;
      const fallbackItem: JobApplication = { id: tempId, ...payload };
      const nextList = editingApp
        ? applications.map((a) => (a.id === tempId ? fallbackItem : a))
        : [fallbackItem, ...applications];
      setApplications(nextList);
      localStorage.setItem("job_tracker_cache", JSON.stringify(nextList));
      setIsModalOpen(false);
    }
  };

  const handleMoveStatus = async (app: JobApplication, newStatus: ApplicationStatus) => {
    const nextList = applications.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a));
    setApplications(nextList);
    localStorage.setItem("job_tracker_cache", JSON.stringify(nextList));

    try {
      await apiFetch(`/tracker/${app.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn("Failed to sync status update to backend:", err);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm("Are you sure you want to remove this job application?")) return;
    const nextList = applications.filter((a) => a.id !== appId);
    setApplications(nextList);
    localStorage.setItem("job_tracker_cache", JSON.stringify(nextList));

    try {
      await apiFetch(`/tracker/${appId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete from backend:", err);
    }
  };

  // Status index transitions
  const stageOrder: ApplicationStatus[] = ["Applied", "Assessment", "Interview", "Offer", "Rejected"];

  const moveLeft = (app: JobApplication) => {
    const currentIndex = stageOrder.indexOf(app.status);
    if (currentIndex > 0) {
      handleMoveStatus(app, stageOrder[currentIndex - 1]);
    }
  };

  const moveRight = (app: JobApplication) => {
    const currentIndex = stageOrder.indexOf(app.status);
    if (currentIndex < stageOrder.length - 1) {
      handleMoveStatus(app, stageOrder[currentIndex + 1]);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q)) ||
      (app.notes && app.notes.toLowerCase().includes(q))
    );
  });

  // Stats calculation
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === "Applied").length;
  const assessmentCount = applications.filter((a) => a.status === "Assessment").length;
  const interviewCount = applications.filter((a) => a.status === "Interview").length;
  const offerCount = applications.filter((a) => a.status === "Offer").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading Job Application Tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <span>Job Application Tracker</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold tracking-wide">
              Kanban Board
            </span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Track your applied roles, technical assessments, interview rounds, and job offers in one place.
          </p>
        </div>

        <button
          onClick={() => openAddModal("Applied")}
          className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Job</span>
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Applied</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalCount}</p>
          <span className="text-[11px] text-slate-500">All submissions</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Assessments</span>
            <Code2Icon className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-200 mt-2">{assessmentCount}</p>
          <span className="text-[11px] text-amber-400/70">Tests & take-homes</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-300">Interviewing</span>
            <Flame className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-violet-200 mt-2">{interviewCount}</p>
          <span className="text-[11px] text-violet-400/70">Rounds in progress</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Final Offers</span>
            <TrophyIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300 mt-2">{offerCount}</p>
          <span className="text-[11px] text-emerald-400/70">Celebration stage 🎉</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Archived / Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">{rejectedCount}</p>
          <span className="text-[11px] text-rose-400/70">Stepping stones</span>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search company, role, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>💡 Tip: Click arrows on any card to move it across stages.</span>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colApps = filteredApps.filter((a) => a.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="glass-panel rounded-2xl border border-slate-800/80 flex flex-col min-h-[500px] overflow-hidden bg-slate-950/40"
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-b ${col.gradient}`}
              >
                <div className="flex items-center space-x-2">
                  <ColIcon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${col.badgeBg}`}
                  >
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

              {/* Column Cards List */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
                {colApps.length === 0 ? (
                  <div className="text-center py-10 px-3 border border-dashed border-slate-800/80 rounded-xl">
                    <p className="text-xs text-slate-500 leading-relaxed">{col.emptyText}</p>
                    <button
                      onClick={() => openAddModal(col.id)}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add {col.title}
                    </button>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="group bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 space-y-2.5 shadow-md hover:shadow-lg transition-all relative overflow-hidden"
                    >
                      {/* Top Accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${col.color}`} />

                      {/* Header: Company & Role */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                            {app.company}
                          </h4>
                          <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                            {app.role}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-violet-400 rounded-md hover:bg-slate-800 transition-all"
                              title="Open Job Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Meta Tags (Location, Salary, Date) */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {app.location && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{app.location}</span>
                          </span>
                        )}
                        {app.salary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            <span>{app.salary}</span>
                          </span>
                        )}
                        {app.date_applied && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            <span>{app.date_applied}</span>
                          </span>
                        )}
                      </div>

                      {/* Next Step / Action Item */}
                      {app.next_step && (
                        <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10 flex items-start gap-1.5 text-xs text-violet-300">
                          <AlertCircle className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight font-medium">{app.next_step}</span>
                        </div>
                      )}

                      {/* Notes snippet */}
                      {app.notes && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                          &quot;{app.notes}&quot;
                        </p>
                      )}

                      {/* Transition & Stage Mover Controls */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <button
                          onClick={() => moveLeft(app)}
                          disabled={stageOrder.indexOf(app.status) === 0}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition-all rounded hover:bg-slate-800"
                          title="Move to previous stage"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Quick stage selector */}
                        <select
                          value={app.status}
                          onChange={(e) => handleMoveStatus(app, e.target.value as ApplicationStatus)}
                          className="text-[10px] bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500 font-medium cursor-pointer"
                        >
                          {stageOrder.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => moveRight(app)}
                          disabled={stageOrder.indexOf(app.status) === stageOrder.length - 1}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition-all rounded hover:bg-slate-800"
                          title="Move to next stage"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingApp ? "Edit Job Application" : "Track New Job Application"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Stripe, OpenAI"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Engineer"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Application Stage
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  >
                    {stageOrder.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
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
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="$120k - $140k"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Job Link / URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/jobs/..."
                    value={formJobUrl}
                    onChange={(e) => setFormJobUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Next Step / Action Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. System design round on Tuesday at 4 PM"
                  value={formNextStep}
                  onChange={(e) => setFormNextStep(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Interview Notes & Insights
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with engineering director, team uses FastAPI, Next.js, and Kubernetes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20"
                >
                  {editingApp ? "Save Changes" : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
