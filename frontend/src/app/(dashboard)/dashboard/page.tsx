"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  FileText,
  UserCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ResumeItem {
  id: number;
  jd_title: string;
  template_name: string;
  created_at: string;
  ats_report: {
    score: number;
    breakdown: Record<string, number>;
  } | null;
}

export default function DashboardPage() {
  const { apiFetch, user, token } = useAuth();
  const [history, setHistory] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState({
    skills: 0,
    projects: 0,
    experience: 0,
    education: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const hist = await apiFetch("/resume/history");
        setHistory(hist);

        const prof = await apiFetch("/profile");
        setProfileComplete({
          skills: prof.skills.length,
          projects: prof.projects.length,
          experience: prof.experience.length,
          education: prof.education.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token]); // Re-run whenever the logged-in user/token changes

  const totalResumes = history.length;
  const avgAtsScore = totalResumes
    ? Math.round(
        history.reduce((acc, curr) => acc + (curr.ats_report?.score || 0), 0) /
          totalResumes
      )
    : 0;

  const isProfileEmpty =
    !profileComplete.skills &&
    !profileComplete.projects &&
    !profileComplete.experience &&
    !profileComplete.education;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Welcome back, {user?.name || "Candidate"}!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Here is an overview of your master profile and AI resume optimizations.
          </p>
        </div>
        <Link
          href="/jd-analysis"
          className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 w-fit"
        >
          <Sparkles className="w-4 h-4" />
          <span>Tailor New Resume</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <FileText className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tailored Resumes
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {totalResumes}
              </h3>
            </div>
            <div className="p-2.5 bg-violet-500/10 rounded-xl">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Successfully generated versions</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <ShieldCheck className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average ATS Score
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {avgAtsScore ? `${avgAtsScore}%` : "N/A"}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            {avgAtsScore >= 80
              ? "Excellent average match rate!"
              : totalResumes
              ? "Optimize details to reach 80%+"
              : "No resume scores computed yet"}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <UserCheck className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Profile Sections
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {Object.values(profileComplete).filter((v) => v > 0).length} / 4
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            {isProfileEmpty
              ? "Master profile is completely empty"
              : "Profile synchronization active"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <Zap className="w-32 h-32 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                AI Agent Engine
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                Active
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            SQLite + Qdrant RAG ready
          </p>
        </div>
      </div>

      {/* Main Grid: Checklist & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile completes */}
        <div className="glass-card p-6 rounded-2xl h-fit space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Profile Completeness</h2>
            <p className="text-xs text-slate-500 mt-1">
              Add elements to your profile to power high-accuracy vector RAG matching.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Skills ({profileComplete.skills})</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profileComplete.skills > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {profileComplete.skills > 0 ? "Ready" : "Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Experience ({profileComplete.experience})</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profileComplete.experience > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {profileComplete.experience > 0 ? "Ready" : "Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Projects ({profileComplete.projects})</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profileComplete.projects > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {profileComplete.projects > 0 ? "Ready" : "Missing"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Education ({profileComplete.education})</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profileComplete.education > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {profileComplete.education > 0 ? "Ready" : "Missing"}
              </span>
            </div>
          </div>

          <Link
            href="/profile"
            className="flex items-center justify-center space-x-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all w-full pt-2"
          >
            <span>Configure Master Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* History Checklist */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Recent Tailored Resumes</h2>
                <p className="text-xs text-slate-500 mt-1">
                  History of your optimized resumes generated via LLM tailoring.
                </p>
              </div>
              <Link
                href="/resumes"
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
              >
                View Catalog
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Loading catalog logs...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No resumes tailored yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Once you synchronize your master profile and upload a job description, your tailored versions will show up here.
                </p>
                <Link
                  href="/jd-analysis"
                  className="inline-flex items-center space-x-2 text-xs text-violet-400 hover:text-violet-300 mt-4 font-semibold"
                >
                  <span>Optimize a resume now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="text-sm font-bold text-slate-200 truncate">
                        {item.jd_title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Template: <span className="capitalize">{item.template_name}</span> •{" "}
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">ATS Match</span>
                        <span
                          className={`text-sm font-bold ${
                            (item.ats_report?.score || 0) >= 80
                              ? "text-emerald-400"
                              : (item.ats_report?.score || 0) >= 60
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {item.ats_report?.score || 0}%
                        </span>
                      </div>
                      <Link
                        href={`/resumes?id=${item.id}`}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-all"
                        title="View Resume details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {history.length > 5 && (
            <div className="text-center pt-4 border-t border-slate-800/50 mt-4">
              <Link
                href="/resumes"
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold"
              >
                See all {history.length} tailored resumes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
