"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Sparkles,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Master Profile", href: "/profile", icon: UserCircle },
    { name: "Tailored Resumes", href: "/resumes", icon: FileText },
    { name: "Job Analyzer & Tailor", href: "/jd-analysis", icon: Sparkles },
    { name: "AI Resume Reviewer", href: "/reviewer", icon: ShieldCheck },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse">Initializing Copilot Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0e1322] border-r border-slate-800 p-4 shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-4 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Resume Copilot
              </span>
              <span className="block text-[10px] text-violet-400 font-semibold tracking-wider uppercase">
                AI Career Suite
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-violet-300 border-l-4 border-violet-500"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-800/80 pt-4 px-2">
          <div className="flex items-center justify-between mb-3">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || "Candidate"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0e1322] border-b border-slate-800 px-4 flex items-center justify-between z-50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-md text-white">Resume Copilot</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0b0f19] z-40 pt-16 flex flex-col justify-between p-4 border-r border-slate-800">
          <nav className="space-y-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-slate-800 pt-4 pb-6">
            <div className="mb-4 px-2">
              <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setIsMobileOpen(false);
                logout();
              }}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Page Content Body */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
