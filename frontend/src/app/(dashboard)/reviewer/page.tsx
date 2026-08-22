"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Play,
  TrendingUp,
} from "lucide-react";

interface CritiqueReport {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  ats_risks: string[];
  recommendations: string[];
}

export default function ReviewerPage() {
  const { apiFetch } = useAuth();
  const searchParams = useSearchParams();

  const [history, setHistory] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | "">("");
  
  // Critique state
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<CritiqueReport | null>(null);

  // Load history list
  const loadHistory = async () => {
    try {
      const data = await apiFetch("/resume/history");
      setHistory(data);

      // Check for parameter id
      const paramId = searchParams.get("id");
      if (paramId) {
        const idVal = parseInt(paramId);
        setSelectedResumeId(idVal);
        triggerReview(idVal);
      } else if (data.length > 0) {
        setSelectedResumeId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerReview = async (resumeId: number) => {
    setLoading(true);
    setCritique(null);
    try {
      const data = await apiFetch("/resume/review", {
        method: "POST",
        body: JSON.stringify({ resume_id: resumeId }),
      });
      setCritique(data);
    } catch (err) {
      console.error(err);
      alert("Failed to review the selected resume version.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchParams]);

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) return;
    triggerReview(selectedResumeId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/60 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          AI Resume Reviewer Agent
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Run the Auditor Agent on a tailored resume to discover strengths, weaknesses, and recruiter risk factors.
        </p>
      </div>

      {/* Select Resume form */}
      <form onSubmit={handleRunAudit} className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Tailored Resume Version
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value ? parseInt(e.target.value) : "")}
            className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-violet-500"
          >
            <option value="">-- Choose from History --</option>
            {history.map((item) => (
              <option key={item.id} value={item.id}>
                {item.jd_title} (ATS Score: {item.ats_report?.score || 0}%)
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !selectedResumeId}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-6 py-3.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 w-full sm:w-auto shrink-0 shadow-lg shadow-violet-500/20"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? "Running Audit..." : "Run Auditor Agent"}</span>
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse">Recruitment Auditor auditing candidate file...</p>
        </div>
      )}

      {/* Critique Results display */}
      {critique && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Panel: Score Summary */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-violet-500/10 rounded-2xl shrink-0">
                <ShieldCheck className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-200">Auditor Grade Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  General critique metrics matching professional standard profiles.
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Overall Grade
              </span>
              <span className="text-3xl font-extrabold text-white mt-1 block">
                {critique.overall_score}%
              </span>
            </div>
          </div>

          {/* Grid: Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Structural Strengths</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {critique.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-400 mr-2 shrink-0 font-bold">•</span>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Weaknesses & Gaps</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {critique.weaknesses.map((wk, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-rose-400 mr-2 shrink-0 font-bold">•</span>
                    <span className="leading-relaxed">{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ATS Risk Factors & Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ATS Risks */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>ATS Formatting & Keyword Risks</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {critique.ats_risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-amber-400 mr-2 shrink-0 font-bold">•</span>
                    <span className="leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advice */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <span>Recruiter Recommendations</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                {critique.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-violet-400 mr-2 shrink-0 font-bold">•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No selection default state */}
      {!critique && !loading && (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          <FileText className="w-10 h-10 text-slate-800 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-400">No Audit Generated</h3>
          <p className="text-xs text-slate-600 mt-1">Select a tailored resume from your history dropdown above and run the audit.</p>
        </div>
      )}
    </div>
  );
}
