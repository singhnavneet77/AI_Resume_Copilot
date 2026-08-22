"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Key,
  ShieldCheck,
  Cpu,
  Database,
  User,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { apiFetch, user } = useAuth();
  
  // Settings States
  const [preferredProvider, setPreferredProvider] = useState("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  
  // Environment metadata from backend
  const [dbUrl, setDbUrl] = useState("sqlite:///./resume_copilot.db");
  const [qdrantPath, setQdrantPath] = useState("qdrant_local_storage");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password visibility
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiFetch("/settings");
        setPreferredProvider(data.preferred_provider || "gemini");
        setGeminiApiKey(data.gemini_api_key || "");
        setOpenaiApiKey(data.openai_api_key || "");
        setDbUrl(data.database_url || "sqlite:///./resume_copilot.db");
        setQdrantPath(data.qdrant_path || "qdrant_local_storage");
      } catch (err) {
        console.error("Failed to load settings from server", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await apiFetch("/settings", {
        method: "POST",
        body: JSON.stringify({
          preferred_provider: preferredProvider,
          gemini_api_key: geminiApiKey,
          openai_api_key: openaiApiKey,
        }),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update credentials on server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Fetching Workspace Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Configure your AI keys, toggle LLM provider architectures, and view local server schemas.
          </p>
        </div>
        
        {success && (
          <span className="flex items-center text-xs text-emerald-400 font-semibold space-x-1 animate-fade-in bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Credentials form */}
        <form onSubmit={handleSave} className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>LLM Providers Configuration</span>
          </h3>

          <div className="space-y-4">
            {/* Preferred selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Preferred LLM Engine
              </label>
              <select
                value={preferredProvider}
                onChange={(e) => setPreferredProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-violet-500"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI (GPT Models)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Choose which model provider performs the summary customization and resumes matching. 
                Google Gemini (via gemini-1.5-flash) is highly recommended for speed and structured outputs.
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGemini ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* OpenAI API Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenai ? "text" : "password"}
                  placeholder="sk-proj-..."
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900/40 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
          >
            <Save className="w-4 h-4 text-violet-200" />
            <span>{saving ? "Saving configurations..." : "Save API credentials"}</span>
          </button>
        </form>

        {/* Database & Environment Info panel */}
        <div className="space-y-6">
          {/* User info */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
              <User className="w-4 h-4 text-violet-400" />
              <span>User Profile Info</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Name</span>
                <span className="text-sm text-slate-200 font-medium">{user?.name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Email</span>
                <span className="text-sm text-slate-200 font-medium">{user?.email}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Role ID</span>
                <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md font-medium border border-violet-500/20">
                  User-{user?.id}
                </span>
              </div>
            </div>
          </div>

          {/* Database metrics */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800/80 pb-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Database Status</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Primary SQL DB</span>
                <span className="text-xs text-slate-400 font-mono break-all leading-normal">{dbUrl}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Qdrant Storage</span>
                <span className="text-xs text-slate-400 font-mono break-all leading-normal">{qdrantPath}</span>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-xs text-slate-400 font-medium">SQLite Engine Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
