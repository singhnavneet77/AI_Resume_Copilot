"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Printer,
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
  const { apiFetch, token } = useAuth();
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
  }, [searchParams, token]); // Re-run on user/token change or URL param change

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

  // Trigger Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Renders the resume in the exact Overleaf / Jake's Resume style
  const renderOverleafResume = (resume: ResumeVersion["resume_json"]) => (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "10.5pt", color: "#111", lineHeight: 1.35 }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontSize: "22pt", fontWeight: "bold", letterSpacing: "0.5px" }}>{resume.summary.name}</div>
        <div style={{ fontSize: "9pt", marginTop: "4px", color: "#222" }}>
          {[resume.summary.email && `✉ ${resume.summary.email}`, resume.summary.phone && `📞 ${resume.summary.phone}`, resume.summary.linkedin && `🔗 ${resume.summary.linkedin.replace("https://", "")}`, resume.summary.github && `⚙ ${resume.summary.github.replace("https://", "")}`].filter(Boolean).join(" | ")}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #555", margin: "6px 0" }} />

      {/* ── PROFESSIONAL SUMMARY ── */}
      {resume.summary.professional_summary && (
        <div style={{ marginBottom: "8px", fontSize: "9.5pt", color: "#222", fontStyle: "italic" }}>
          {resume.summary.professional_summary}
        </div>
      )}

      {/* ── EDUCATION ── */}
      {resume.education && resume.education.length > 0 && (
        <section style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #333", marginBottom: "5px", paddingBottom: "2px" }}>Education</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                {["Degree/Certificate", "Institute/Board", "CGPA/Percentage", "Year"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontWeight: "bold", paddingBottom: "3px", paddingRight: "8px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resume.education.map((edu, i) => (
                <tr key={i}>
                  <td style={{ paddingTop: "3px", paddingRight: "8px", verticalAlign: "top" }}>{edu.degree}</td>
                  <td style={{ paddingTop: "3px", paddingRight: "8px", verticalAlign: "top" }}>{edu.institute}</td>
                  <td style={{ paddingTop: "3px", paddingRight: "8px", verticalAlign: "top", whiteSpace: "nowrap" }}>{edu.cgpa}</td>
                  <td style={{ paddingTop: "3px", verticalAlign: "top", whiteSpace: "nowrap" }}>{edu.start_date}{edu.end_date ? ` - ${edu.end_date}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── EXPERIENCE ── */}
      {resume.experience && resume.experience.length > 0 && (
        <section style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #333", marginBottom: "5px", paddingBottom: "2px" }}>Experience</div>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10pt" }}>
                <span>⚙ {exp.company}</span>
                <span style={{ fontWeight: "normal", fontStyle: "italic", fontSize: "9.5pt" }}>{exp.start_date} – {exp.end_date}</span>
              </div>
              <div style={{ fontStyle: "italic", fontSize: "9.5pt", marginBottom: "3px" }}>{exp.role}</div>
              <ul style={{ margin: "0", paddingLeft: "16px", listStyleType: "'◦ '" }}>
                {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((b, bi) => (
                  <li key={bi} style={{ fontSize: "9.5pt", marginBottom: "2px" }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── PROJECTS ── */}
      {resume.projects && resume.projects.length > 0 && (
        <section style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #333", marginBottom: "5px", paddingBottom: "2px" }}>Projects</div>
          {resume.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10pt" }}>
                <span>⚙ {proj.title}{proj.github_link ? <span style={{ fontWeight: "normal", fontSize: "8.5pt", marginLeft: "6px" }}>🔗 {proj.github_link.replace("https://", "")}</span> : null}</span>
              </div>
              <div style={{ fontStyle: "italic", fontSize: "9.5pt", marginBottom: "3px" }}>
                Tools: {Array.isArray(proj.tech_stack) ? proj.tech_stack.join(", ") : proj.tech_stack}
              </div>
              <ul style={{ margin: "0", paddingLeft: "16px", listStyleType: "'◦ '" }}>
                {(typeof proj.description === "string" ? proj.description.split("\n").filter(Boolean) : [proj.description]).map((line: string, li: number) => (
                  <li key={li} style={{ fontSize: "9.5pt", marginBottom: "2px" }}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── SKILLS ── */}
      {resume.skills && resume.skills.length > 0 && (
        <section style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #333", marginBottom: "5px", paddingBottom: "2px" }}>Skills</div>
          <div style={{ fontSize: "9.5pt" }}>
            {resume.skills.map((sk, i) => (
              <div key={i} style={{ marginBottom: "3px" }}>
                <span style={{ marginRight: "4px" }}>•</span>
                <strong>{sk.category}:</strong> {sk.items.join(", ")}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ACHIEVEMENTS ── */}
      {resume.achievements && resume.achievements.length > 0 && (
        <section>
          <div style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #333", marginBottom: "5px", paddingBottom: "2px" }}>Achievements</div>
          <ul style={{ margin: "0", paddingLeft: "16px", listStyleType: "'◦ '", fontSize: "9.5pt" }}>
            {resume.achievements.map((ach, i) => (
              <li key={i} style={{ marginBottom: "2px" }}>{ach}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

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

            {/* Print Trigger */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-violet-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
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
            {/* PREVIEW TAB — Overleaf / Jake's Resume Style */}
            {agentTab === "preview" && (
              <div className="bg-white p-8 sm:p-10 shadow-2xl rounded-2xl overflow-hidden resume-print-layout border border-slate-300">
                {renderOverleafResume(selectedResume.resume_json)}
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
