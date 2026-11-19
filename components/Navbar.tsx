"use client";

import React, { useEffect, useState } from "react";
import { Headphones, Moon, Sun, CheckCircle2, Star, BarChart3 } from "lucide-react";

interface NavbarProps {
  heardCount: number;
  starredCount: number;
  totalCount: number;
  onOpenStats: () => void;
}

export function Navbar({ heardCount, starredCount, totalCount, onOpenStats }: NavbarProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const saved = localStorage.getItem("my_hearing_theme") as "dark" | "light" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("my_hearing_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const heardPercent = totalCount > 0 ? Math.round((heardCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--surface)]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
              My Hearing
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              Sadhana & Katha
            </span>
          </div>
        </div>

        {/* Sadhana Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onOpenStats}
            title="View Sadhana Statistics"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--surface-hover)] hover:border-amber-500/50 text-xs font-medium text-[var(--foreground)] transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">{heardCount}</span>
            <span className="text-[var(--muted)] hidden sm:inline">/ {totalCount} ({heardPercent}%)</span>
          </button>

          <button
            onClick={onOpenStats}
            title="View Starred Katha"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--surface-hover)] text-xs font-medium text-[var(--foreground)] hover:border-amber-500/50 transition-all"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold">{starredCount}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:border-amber-500/50 transition-all"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
