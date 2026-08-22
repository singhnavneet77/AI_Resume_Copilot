"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  UserCircle2,
  FileSearch,
  Sparkles,
  ShieldCheck,
  Database,
  Target,
  FileText,
  MessageSquareText,
  Mic,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";

const STEPS = [
  {
    icon: UserCircle2,
    title: "Build your Master Profile — once",
    description:
      "Add every education entry, skill, project, and role you've ever had into one central profile. This is the single source of truth your resumes are built from.",
  },
  {
    icon: FileSearch,
    title: "Paste a job description",
    description:
      "Drop in the JD for a role you're targeting. A local vector search (Qdrant) finds the most relevant pieces of your profile for that specific job.",
  },
  {
    icon: Sparkles,
    title: "Get a tailored, ATS-optimized resume",
    description:
      "The AI reorders and rewrites your real experience — never invents anything — to match the JD's language, and scores it against ATS criteria before you download it.",
  },
  {
    icon: Target,
    title: "Refine, review, and apply",
    description:
      "Use the AI reviewer for a critical pass, generate a matching cover letter and interview prep, then export and apply with confidence.",
  },
];

const FEATURES = [
  {
    icon: Database,
    title: "One Master Profile",
    description:
      "Store your full career history once in PostgreSQL. Every resume you generate afterward draws from this, so you're never re-typing the same project descriptions.",
  },
  {
    icon: Sparkles,
    title: "JD-Aware Tailoring",
    description:
      "Retrieval-augmented generation pulls only the most relevant slice of your profile for each job description, then rewrites it for clarity and keyword alignment.",
  },
  {
    icon: Target,
    title: "ATS Scoring",
    description:
      "Every generated resume gets a 0–100 ATS score broken down by skills match, experience match, keywords, project relevance, and formatting.",
  },
  {
    icon: MessageSquareText,
    title: "Cover Letters & Outreach",
    description:
      "Auto-generate a tailored cover letter, a LinkedIn referral DM, and an application email to go along with your resume.",
  },
  {
    icon: Mic,
    title: "Interview Prep",
    description:
      "Get technical, behavioral, system-design, and role-specific questions — with hints — generated from your actual resume and the target JD.",
  },
  {
    icon: Lock,
    title: "Private by Design",
    description:
      "Your profile, resumes, and API keys are scoped strictly to your account in PostgreSQL — nothing you store is ever visible to, or mixed with, another user's data.",
  },
];

const FAQS = [
  {
    q: "Do I need my own AI provider key?",
    a: "No — you can try it with a built-in fallback generator that works from your profile data with no key at all. For full AI-tailored output, add your own Gemini or OpenAI key from Settings; it's stored securely against your account only.",
  },
  {
    q: "Will it ever invent experience I don't have?",
    a: "No. The tailoring engine is explicitly instructed to only reorder, rewrite, and emphasize what's already in your Master Profile — never to fabricate skills, roles, or achievements.",
  },
  {
    q: "How many tailored resumes can I generate?",
    a: "As many as you like. Each one is saved as its own version in your history, tied to the job description it was generated for, so you can compare and re-download anytime.",
  },
  {
    q: "Where is my data stored?",
    a: "In a PostgreSQL database, with every table scoped by your user ID. Profile data, resumes, and settings for one account are never accessible from another.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-semibold text-violet-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            One Profile. Unlimited Job-Specific Resumes.
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Build one master profile.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Ship a tailored resume
            </span>{" "}
            for every job.
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            AI Resume Copilot keeps your real career history in one place, then
            uses AI and semantic search to reshape it — honestly, without
            invention — into an ATS-optimized resume for each role you apply
            to.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 glass-panel hover:bg-white/5 text-slate-200 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all"
            >
              See how it works
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> No experience is ever invented
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> PostgreSQL-backed, per-account isolation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" /> ATS scoring built in
            </span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">
            How to use it to make your resume better
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Four steps from a blank profile to an application-ready, tailored
            resume.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="glass-panel rounded-2xl p-6 relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20 shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-violet-400">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">
            Everything you need to apply with confidence
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From your first profile entry to a finished application packet.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-panel rounded-2xl p-6 hover:border-violet-500/30 border border-transparent transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 mb-4">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TRUST / ARCHITECTURE STRIP */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" />
              Built for real data, kept private
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Your profile lives in PostgreSQL, scoped strictly to your account
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Login issues a JWT tied to your user ID. Every profile field,
              resume version, ATS report, and AI provider key you save is
              filtered by that same ID at the database level — never a
              shared, global store. That means what you enter, and any key
              you bring, is yours alone.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <Layers className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs font-semibold text-white">Master Profile</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Education, skills, projects, experience, achievements
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <FileText className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs font-semibold text-white">Resume Versions</p>
              <p className="text-[11px] text-slate-500 mt-1">
                One row per tailored resume, tied to the JD it was built for
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <Target className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs font-semibold text-white">ATS Reports</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Score breakdown + missing skills per resume version
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <Lock className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs font-semibold text-white">Your API Keys</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Stored on your account row only, never shared globally
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">{f.q}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to build a resume that actually matches the job?
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Set up your master profile once — it takes a few minutes — and
              generate a fresh, tailored resume for every application after
              that.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              Create your Master Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} AI Resume Copilot. All rights reserved.</span>
          <span>One Profile. Unlimited Job-Specific Resumes.</span>
        </div>
      </footer>
    </div>
  );
}
