"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Zap, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-xl">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            AI Resume Copilot
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{user?.name?.split(" ")[0] || "Dashboard"}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-slate-300 hover:text-white"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0b0f19]/95 backdrop-blur-xl px-5 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-slate-400 hover:text-white transition-colors py-1.5"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
              >
                <span>Login / Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
