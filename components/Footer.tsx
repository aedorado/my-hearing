"use client";

import React from "react";
import { Headphones, ArrowUp, BarChart3, Sparkles } from "lucide-react";

interface FooterProps {
  totalLectures: number;
  speakerCount: number;
  onOpenStats?: () => void;
}

export function Footer({ totalLectures, speakerCount, onOpenStats }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--surface)]/40 backdrop-blur-sm mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          {/* Brand & Purpose */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <span>My Hearing</span>
            </div>
            <span className="hidden sm:inline text-[var(--card-border)]">|</span>
            <span className="italic text-[var(--muted)]">
              Śravaṇaṁ kīrtanaṁ viṣṇoḥ smaraṇam
            </span>
          </div>

          {/* Catalog Stats & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--card-border)] text-[11px] font-medium text-[var(--muted)]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{speakerCount} Speakers</span>
              <span>•</span>
              <span>{totalLectures.toLocaleString()} Kathas</span>
            </div>

            {onOpenStats && (
              <button
                onClick={onOpenStats}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-[var(--card-border)] hover:border-amber-500/40 text-[11px] font-medium transition-colors"
                title="View Sadhana Stats & Data Backup"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="hidden xs:inline">Sadhana Stats</span>
              </button>
            )}

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-hover)] hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-[var(--card-border)] hover:border-amber-500/40 text-[11px] font-medium transition-colors"
              title="Scroll to top"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-3 h-3" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
