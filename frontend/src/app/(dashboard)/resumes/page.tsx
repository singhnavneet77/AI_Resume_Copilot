"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Download,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Code,
  Link as LinkIcon,
  Mail,
  Copy,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Trash2,
} from "lucide-react";

function parseBullets(content: any): string[] {
  if (!content) return [];
  let rawLines: string[] = [];
  if (Array.isArray(content)) {
    content.forEach((item) => {
      if (typeof item === "string") {
        item.split("\n").forEach((sub) => {
          if (sub.trim()) rawLines.push(sub.trim());
        });
      } else if (item) {
        rawLines.push(String(item).trim());
      }
    });
  } else if (typeof content === "string") {
    content.split("\n").forEach((sub) => {
      if (sub.trim()) rawLines.push(sub.trim());
    });
  } else {
    rawLines = [String(content).trim()];
  }

  const bulletMarkers = ["•", "-", "*", "\ufffd", "–"];
  const bullets: string[] = [];

  for (const line of rawLines) {
    const lineClean = line.trim();
    if (!lineClean) continue;

    const startsWithBullet =
      bulletMarkers.some((m) => lineClean.startsWith(m)) ||
      /^\d+[\.\)]\s+/.test(lineClean);
    const cleanedText = lineClean.replace(/^[•\-*\ufffd–\s\d\.\)]+\s*/, "").trim();

    if (!cleanedText) continue;

    if (startsWithBullet || bullets.length === 0) {
      bullets.push(cleanedText);
    } else {
      const prev = bullets[bullets.length - 1];
      if ((!prev.endsWith(".") && !prev.endsWith("!") && !prev.endsWith("?")) || /^[a-z]/.test(lineClean)) {
        bullets[bullets.length - 1] = `${prev} ${cleanedText}`;
      } else {
        bullets.push(cleanedText);
      }
    }
  }

  return bullets;
}

interface ResumeVersion {
  id: number;
  jd_title: string;
  jd_text: string;
  template_name: string;
  created_at: string;
  resume_json: {
    summary: {
      name: string;
      email: string;
      phone: string;
      github: string;
      linkedin: string;
      professional_summary: string;
    };
    skills: Array<{ category: string; items: string[] }>;
    experience: Array<{
      company: string;
      role: string;
      start_date: string;
      end_date: string;
      description: string[];
    }>;
    projects: Array<{
      title: string;
      tech_stack: string[];
      description: string;
      github_link: string;
    }>;
    education: Array<{
      institute: string;
      degree: string;
      cgpa: string;
      start_date: string;
      end_date: string;
    }>;
    achievements: string[];
  };
}

export default function ResumesPage() {
  const { apiFetch } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sub-agent tabs state
  const [agentTab, setAgentTab] = useState<"preview" | "cover-letter" | "interview">("preview");
  
  // Cover Letter Agent State
  const [loadingCover, setLoadingCover] = useState(false);
  const [coverData, setCoverData] = useState<any | null>(null);
  
  // Interview Agent State
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [interviewData, setInterviewData] = useState<any | null>(null);

  // PDF Direct Download State
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Copy helpers
  const [copied, setCopied] = useState<string | null>(null);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadHistory = async () => {
    try {
      const data = await apiFetch("/resume/history");
      setHistory(data);
      
      // Determine initial selection
      const paramId = searchParams.get("id");
      if (paramId) {
        loadDetail(parseInt(paramId));
      } else if (data.length > 0) {
        loadDetail(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadDetail = async (id: number) => {
    setLoadingDetail(true);
    setAgentTab("preview"); // Reset sub-agent tab
    setCoverData(null);
    setInterviewData(null);
    try {
      const data = await apiFetch(`/resume/${id}`);
      setSelectedResume(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchParams]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tailored resume version?")) return;
    try {
      await apiFetch(`/resume/${id}`, { method: "DELETE" });
      setSelectedResume(null);
      loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Cover Letter Agent
  const fetchCoverLetter = async () => {
    if (!selectedResume) return;
    setLoadingCover(true);
    try {
      const data = await apiFetch("/cover-letter/generate", {
        method: "POST",
        body: JSON.stringify({
          resume_json: selectedResume.resume_json,
          jd_text: selectedResume.jd_text,
        }),
      });
      setCoverData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate cover letter assets.");
    } finally {
      setLoadingCover(false);
    }
  };

  // Trigger Interview Agent
  const fetchInterviewPrep = async () => {
    if (!selectedResume) return;
    setLoadingInterview(true);
    try {
      const data = await apiFetch("/interview/questions", {
        method: "POST",
        body: JSON.stringify({
          resume_json: selectedResume.resume_json,
          jd_text: selectedResume.jd_text,
        }),
      });
      setInterviewData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate interview preparation questions.");
    } finally {
      setLoadingInterview(false);
    }
  };

  useEffect(() => {
    if (agentTab === "cover-letter" && !coverData) {
      fetchCoverLetter();
    } else if (agentTab === "interview" && !interviewData) {
      fetchInterviewPrep();
    }
  }, [agentTab]);

  // Single Direct-Download PDF Action (No browser print dialog, no menus)
  const handleDownloadPdf = async () => {
    if (!selectedResume) return;
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/resume/${selectedResume.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("Failed to download PDF from server");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const rawName = selectedResume.resume_json?.summary?.name || "Resume";
      const safeName = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeName || "Resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("PDF download failed", err);
      alert("Failed to download resume PDF. Please check backend connection.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // CSS template variations for live rendering in the previewer
  const getTemplateStyle = (type: string) => {
    switch (type) {
      case "software":
        return {
          font: "font-mono text-slate-900",
          header: "text-left border-b-2 border-indigo-600 pb-2 mb-4",
          sectionHeader: "text-indigo-600 font-bold uppercase tracking-wider border-b border-indigo-200 mt-4 mb-2 pb-0.5",
        };
      case "ai":
        return {
          font: "font-sans text-slate-900",
          header: "text-center bg-slate-100 p-4 rounded-xl border border-slate-200 mb-4",
          sectionHeader: "text-violet-600 font-extrabold uppercase tracking-wide border-l-4 border-violet-500 pl-2 mt-4 mb-2 pb-0.5",
        };
      case "data":
        return {
          font: "font-sans text-slate-900",
          header: "text-left border-l-8 border-slate-800 pl-4 mb-4",
          sectionHeader: "text-slate-800 font-bold border-b border-slate-300 mt-4 mb-2 pb-0.5",
        };
      case "research":
        return {
          font: "font-serif text-slate-900",
          header: "text-center mb-6",
          sectionHeader: "text-slate-900 font-semibold border-b border-slate-300 mt-5 mb-2.5 pb-0.5 italic text-center",
        };
      default: // modern
        return {
          font: "font-sans text-slate-900",
          header: "text-center mb-4 pb-2 border-b border-slate-200",
          sectionHeader: "text-slate-800 font-bold tracking-tight border-b border-slate-300 mt-4 mb-2 pb-0.5",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Resume List Catalog */}
      <div className="lg:col-span-1 space-y-4 no-print print-hide">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
          Tailored Catalog
        </h3>

        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-slate-500">Loading catalog...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 bg-[#0e1322]/40 border border-dashed border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">Empty Catalog</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {history.map((item) => {
              const isSelected = selectedResume?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => loadDetail(item.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-violet-600/10 border-violet-500/60"
                      : "bg-[#0e1322]/50 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="text-xs font-bold text-slate-200 truncate flex-1">
                      {item.jd_title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-slate-500">
                      Score:{" "}
                      <span
                        className={`font-semibold ${
                          (item.ats_report?.score || 0) >= 80 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {item.ats_report?.score || 0}%
                      </span>
                    </span>
                    <span className="text-[9px] text-slate-600">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Pane - splits between HTML resume preview and sub-agents */}
      <div className="lg:col-span-3 space-y-6">
        {selectedResume && (
          <div className="flex justify-between items-center bg-[#0e1322] border border-slate-800 p-4 rounded-2xl no-print print-hide">
            {/* Header info */}
            <div>
              <h2 className="text-md font-bold text-slate-200 truncate max-w-md">
                {selectedResume.jd_title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Template: <span className="capitalize">{selectedResume.template_name}</span>
              </p>
            </div>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              title="Direct Download PDF"
              className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-violet-500/20 disabled:opacity-60 cursor-pointer"
            >
              {downloadingPdf ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloadingPdf ? "Downloading..." : "Download PDF"}</span>
            </button>
          </div>
        )}

        {/* View Tabs */}
        {selectedResume && (
          <div className="flex border-b border-slate-800 no-print print-hide">
            <button
              onClick={() => setAgentTab("preview")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                agentTab === "preview"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Document Preview
            </button>
            <button
              onClick={() => setAgentTab("cover-letter")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                agentTab === "cover-letter"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Cover Letter Agent
            </button>
            <button
              onClick={() => setAgentTab("interview")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                agentTab === "interview"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Interview Prep Agent
            </button>
          </div>
        )}

        {/* Details Load Spinner */}
        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Loading document assets...</p>
          </div>
        ) : selectedResume ? (
          <div>
            {/* PREVIEW TAB */}
            {agentTab === "preview" && (
              <div className="bg-white p-8 sm:p-12 shadow-2xl rounded-2xl w-full max-w-full overflow-visible resume-print-layout text-slate-900 border border-slate-300">
                {(() => {
                  const style = getTemplateStyle(selectedResume.template_name);
                  const resume = selectedResume.resume_json;
                  return (
                    <div className={`${style.font} text-[10.5pt] leading-normal`}>
                      {/* HEADER SUMMARY */}
                      <header className={style.header}>
                        <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900">
                          {resume.summary.name}
                        </h1>
                        {(() => {
                          const contactParts: React.ReactNode[] = [];
                          if (resume.summary.email) {
                            contactParts.push(
                              <a key="email" href={`mailto:${resume.summary.email}`} className="hover:text-indigo-600 hover:underline">
                                {resume.summary.email}
                              </a>
                            );
                          }
                          if (resume.summary.phone) {
                            contactParts.push(<span key="phone">{resume.summary.phone}</span>);
                          }
                          if (resume.summary.github) {
                            const cleanGh = resume.summary.github.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
                            const ghUrl = resume.summary.github.startsWith("http") ? resume.summary.github : `https://${resume.summary.github}`;
                            contactParts.push(
                              <a key="github" href={ghUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
                                {cleanGh}
                              </a>
                            );
                          }
                          if (resume.summary.linkedin) {
                            const cleanLi = resume.summary.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
                            const liUrl = resume.summary.linkedin.startsWith("http") ? resume.summary.linkedin : `https://${resume.summary.linkedin}`;
                            contactParts.push(
                              <a key="linkedin" href={liUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
                                {cleanLi}
                              </a>
                            );
                          }
                          if (contactParts.length === 0) return null;
                          const isCentered = !style.header.includes("text-left");
                          return (
                            <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 mt-2 font-medium ${isCentered ? "justify-center" : "justify-start"}`}>
                              {contactParts.map((part, pidx) => (
                                <React.Fragment key={pidx}>
                                  {pidx > 0 && <span className="text-slate-400 select-none">|</span>}
                                  {part}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                        {resume.summary.professional_summary && (
                          <p className="text-xs text-slate-600 mt-3 text-justify leading-relaxed italic">
                            {resume.summary.professional_summary}
                          </p>
                        )}
                      </header>

                      {/* SKILLS */}
                      {resume.skills && resume.skills.length > 0 && (
                        <section className="page-break-avoid">
                          <h2 className={style.sectionHeader}>Skills & Competencies</h2>
                          <div className="space-y-1 text-xs text-slate-800">
                            {resume.skills.map((sk, idx) => (
                              <p key={idx} className="leading-relaxed">
                                <strong className="font-semibold">{sk.category}:</strong>{" "}
                                {sk.items.join(", ")}
                              </p>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* EXPERIENCE */}
                      {resume.experience && resume.experience.length > 0 && (
                        <section>
                          <h2 className={style.sectionHeader}>Work Experience</h2>
                          <div className="space-y-4">
                            {resume.experience.map((exp, idx) => {
                              const bullets = parseBullets(exp.description);
                              return (
                                <div key={idx} className="experience-item page-break-avoid text-xs w-full max-w-full">
                                  <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1 font-semibold text-slate-800">
                                    <span>
                                      {exp.role} at <strong className="font-bold">{exp.company}</strong>
                                    </span>
                                    <span className="text-slate-500 italic font-medium shrink-0 ml-2">
                                      {exp.start_date} – {exp.end_date}
                                    </span>
                                  </div>
                                  <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-slate-700">
                                    {bullets.map((bullet, bidx) => (
                                      <li key={bidx} className="leading-relaxed break-words whitespace-normal text-left">
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* PROJECTS */}
                      {resume.projects && resume.projects.length > 0 && (
                        <section>
                          <h2 className={style.sectionHeader}>Key Projects</h2>
                          <div className="space-y-3.5">
                            {resume.projects.map((proj, idx) => {
                              const bullets = parseBullets(proj.description);
                              const techStr = Array.isArray(proj.tech_stack)
                                ? proj.tech_stack.join(", ")
                                : proj.tech_stack || "";
                              return (
                                <div key={idx} className="project-item page-break-avoid text-xs w-full max-w-full">
                                  <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1 font-semibold text-slate-800">
                                    <span className="font-bold flex items-center flex-wrap">
                                      {proj.title}
                                      {proj.github_link && (
                                        <a
                                          href={proj.github_link.startsWith("http") ? proj.github_link : `https://${proj.github_link}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[9px] text-indigo-600 hover:text-indigo-800 ml-1.5 underline italic font-normal"
                                        >
                                          ({proj.github_link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")})
                                        </a>
                                      )}
                                    </span>
                                    {techStr && (
                                      <span className="text-slate-500 italic font-medium text-right text-[11px] max-w-full">
                                        {techStr}
                                      </span>
                                    )}
                                  </div>
                                  {bullets.length > 1 ? (
                                    <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-slate-700">
                                      {bullets.map((bullet, bidx) => (
                                        <li key={bidx} className="leading-relaxed break-words whitespace-normal text-left">
                                          {bullet}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : bullets.length === 1 ? (
                                    <p className="text-slate-700 mt-1 leading-relaxed break-words whitespace-normal text-left">
                                      {bullets[0]}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* EDUCATION */}
                      {resume.education && resume.education.length > 0 && (
                        <section className="page-break-avoid">
                          <h2 className={style.sectionHeader}>Education</h2>
                          <div className="space-y-2">
                            {resume.education.map((edu, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-slate-800">
                                <div>
                                  <strong className="font-bold">{edu.degree}</strong> –{" "}
                                  <span className="italic">{edu.institute}</span>
                                </div>
                                <div className="text-right text-slate-500 shrink-0 ml-2 font-medium">
                                  {edu.cgpa && <span className="mr-2">GPA: {edu.cgpa}</span>}
                                  {edu.start_date} – {edu.end_date}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* ACHIEVEMENTS */}
                      {resume.achievements && resume.achievements.length > 0 && (
                        <section className="page-break-avoid">
                          <h2 className={style.sectionHeader}>Achievements & Honors</h2>
                          <ul className="list-disc list-outside ml-4 text-xs text-slate-700 space-y-1">
                            {resume.achievements.map((ach, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* COVER LETTER TAB */}
            {agentTab === "cover-letter" && (
              <div className="space-y-6 no-print print-hide">
                {loadingCover ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500">Drafting personalized cover letter assets...</p>
                  </div>
                ) : coverData ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Cover Letter Section */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <span>Standard Cover Letter</span>
                        </h3>
                        <button
                          onClick={() => triggerCopy(coverData.cover_letter, "cl")}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
                        >
                          {copied === "cl" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied === "cl" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans max-h-96 overflow-y-auto">
                        {coverData.cover_letter}
                      </div>
                    </div>

                    {/* Email application Section */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span>Application Email Body</span>
                        </h3>
                        <button
                          onClick={() => triggerCopy(coverData.application_email, "email")}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
                        >
                          {copied === "email" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied === "email" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {coverData.application_email}
                      </div>
                    </div>

                    {/* LinkedIn referral Section */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-sky-400" />
                          <span>LinkedIn Referral / DM Pitch</span>
                        </h3>
                        <button
                          onClick={() => triggerCopy(coverData.linkedin_dm, "li")}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
                        >
                          {copied === "li" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied === "li" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {coverData.linkedin_dm}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* INTERVIEW PREP TAB */}
            {agentTab === "interview" && (
              <div className="space-y-6 no-print print-hide">
                {loadingInterview ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500">Drafting potential interview queries...</p>
                  </div>
                ) : interviewData ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Render helper */}
                    {(() => {
                      const sections = [
                        { title: "Technical Questions", data: interviewData.technical_questions },
                        { title: "Behavioral Questions", data: interviewData.behavioral_questions },
                        { title: "System Design Questions", data: interviewData.system_design_questions },
                        { title: "Role-Specific Questions", data: interviewData.role_specific_questions },
                      ];

                      return sections.map((sect, sidx) => (
                        <div key={sidx} className="glass-panel p-6 rounded-2xl space-y-4">
                          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                            {sect.title}
                          </h3>
                          
                          <div className="space-y-4">
                            {sect.data.map((q: any, idx: number) => (
                              <div key={idx} className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2.5">
                                <h4 className="text-xs font-bold text-slate-200 flex items-start">
                                  <HelpCircle className="w-4 h-4 text-violet-400 shrink-0 mr-2 mt-0.5" />
                                  <span>{q.question}</span>
                                </h4>
                                <div className="pl-6 border-l-2 border-slate-800/80 text-xs text-slate-400 leading-relaxed font-sans italic">
                                  <strong className="font-semibold text-slate-500 block not-italic mb-1">Recruiter Tip:</strong>
                                  {q.hint}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl no-print print-hide bg-slate-900/10">
            <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <h3 className="text-md font-bold text-slate-400">No Document Selected</h3>
            <p className="text-xs text-slate-600 mt-1">Select a tailored resume version from the catalog on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
}
