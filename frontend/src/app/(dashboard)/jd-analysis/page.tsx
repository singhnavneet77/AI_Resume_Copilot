"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Layout,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Brain,
  MessageSquare,
  Mail,
  Zap,
} from "lucide-react";

interface TailorResponse {
  id: number;
  jd_title: string;
  jd_text: string;
  resume_json: any;
  template_name: string;
  ats_report: {
    score: number;
    missing_skills: string[];
    improvement_suggestions: string[];
    breakdown: {
      skills_match: number;
      experience_match: number;
      keyword_match: number;
      project_relevance: number;
      formatting: number;
    };
  };
}

export default function JDAnalysisPage() {
  const { apiFetch } = useAuth();
  const router = useRouter();

  // Inputs
  const [jdTitle, setJdTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [templateName, setTemplateName] = useState("modern");

  // Output states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<TailorResponse | null>(null);

  const templates = [
    { id: "modern", name: "Modern ATS Resume", desc: "Clean standard design for general roles" },
    { id: "software", name: "Software Engineer", desc: "Highlighting languages and API engineering" },
    { id: "ai", name: "AI Engineer", desc: "Focus on LLMs, neural networks, and pipelines" },
    { id: "data", name: "Data Engineer", desc: "Prioritizing pipeline scaling and database indexes" },
    { id: "research", name: "Research Resume", desc: "Structured for publications and academics" },
  ];

  const loadingSteps = [
    "Analyzing job description keywords...",
    "Querying Qdrant local vector database for matching achievements...",
    "Invoking Gemini models to customize resume bullet points...",
    "Optimizing keywords matching ATS standards...",
    "Calculating ATS compatibility score components...",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdTitle || !jdText) return;

    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    // Increment loading step to look interactive
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);

    try {
      const data = await apiFetch("/resume/generate", {
        method: "POST",
        body: JSON.stringify({
          jd_title: jdTitle,
          jd_text: jdText,
          template_name: templateName,
        }),
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to tailor resume. Ensure your profile has details.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/60 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Job Description Analyzer & Tailoring
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Paste a target job description to query relevant items in Qdrant and customize an optimized resume.
        </p>
      </div>

      {!result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Target Job Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Machine Learning Engineer"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Paste Job Description text
              </label>
              <textarea
                rows={10}
                required
                placeholder="We are looking for a Software Engineer with 3+ years experience with Python, FastAPI, React, and databases. Experience with vector database indexing (Qdrant) and prompt engineering is a big plus..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
            >
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span>Generate Tailored Resume & Score</span>
            </button>
          </form>

          {/* Template Selection Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1">
              Select Resume Layout Template
            </h3>
            <div className="space-y-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplateName(tpl.id)}
                  className={`flex items-start text-left w-full p-4 rounded-xl border transition-all ${
                    templateName === tpl.id
                      ? "bg-violet-600/10 border-violet-500/60 ring-1 ring-violet-500"
                      : "bg-[#0e1322]/50 border-slate-800/80 hover:border-slate-700/80"
                  }`}
                >
                  <Layout className={`w-4 h-4 shrink-0 mt-0.5 mr-3 ${templateName === tpl.id ? "text-violet-400" : "text-slate-500"}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{tpl.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{tpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Steps Panel */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 max-w-xl mx-auto glass-panel p-8 rounded-2xl border border-violet-500/20 space-y-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <Brain className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-md font-bold text-slate-200">AI Tailor Engine Processing...</h3>
            <p className="text-xs text-slate-500 animate-pulse">{loadingSteps[loadingStep]}</p>
          </div>

          {/* Simple step pipeline indicator */}
          <div className="flex space-x-1.5 pt-4">
            {loadingSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-1 rounded-full transition-all duration-500 ${
                  idx <= loadingStep ? "bg-violet-500" : "bg-slate-800"
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Tailored Result Overview */}
      {result && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Actions & score card summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Radial score gauge */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                ATS Compatibility Score
              </span>
              
              {/* Radial gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    strokeWidth="10"
                    stroke="hsl(var(--border))"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    strokeWidth="10"
                    stroke={result.ats_report.score >= 80 ? "#10b981" : "#f59e0b"}
                    fill="transparent"
                    className="radial-progress-circle"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - result.ats_report.score / 100)}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-white">{result.ats_report.score}%</span>
                  <span className="block text-[10px] text-slate-500 font-semibold mt-1">Match Rate</span>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400">Optimized for search engines</span>
              </div>
            </div>

            {/* Score Component Breakdown details */}
            <div className="glass-panel p-6 rounded-2xl md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                ATS Match Breakdown
              </h3>
              
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Skills Alignment (40%)</span>
                    <span className="text-slate-200">{result.ats_report.breakdown.skills_match} / 40</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${(result.ats_report.breakdown.skills_match / 40) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Experience Relevancy (25%)</span>
                    <span className="text-slate-200">{result.ats_report.breakdown.experience_match} / 25</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(result.ats_report.breakdown.experience_match / 25) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Keyword Density (15%)</span>
                    <span className="text-slate-200">{result.ats_report.breakdown.keyword_match} / 15</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${(result.ats_report.breakdown.keyword_match / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Projects (10%)
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                      {result.ats_report.breakdown.project_relevance} / 10
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Format Check (10%)
                    </span>
                    <span className="text-sm font-bold text-slate-200">
                      {result.ats_report.breakdown.formatting} / 10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Skills Alerts & Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Skills */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Identified Skill Gaps</h3>
              </div>
              <p className="text-xs text-slate-500">
                These core technologies are requested in the job description but were missing or weak in your master profile.
              </p>

              {result.ats_report.missing_skills.length === 0 ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">
                  Perfect match! No missing skills detected.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.ats_report.missing_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Improvement ideas */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                ATS Improvement Actions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                {result.ats_report.improvement_suggestions.map((sug, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Summary Actions Widget */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-violet-600/5">
            <div>
              <h3 className="text-md font-bold text-slate-200 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-violet-400 animate-pulse" />
                <span>Tailoring Complete!</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your tailored resume is formatted and cached. Choose what you'd like to do next:
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => router.push(`/resumes?id=${result.id}`)}
                className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-violet-500/10"
              >
                <FileText className="w-4 h-4" />
                <span>View & Export PDF</span>
              </button>
              <button
                onClick={() => router.push(`/reviewer?id=${result.id}`)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all border border-slate-700"
              >
                <MessageSquare className="w-4 h-4" />
                <span>AI Reviewer Agent</span>
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setJdTitle("");
                  setJdText("");
                }}
                className="text-xs text-slate-400 hover:text-slate-300 font-semibold px-2 py-1.5"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
