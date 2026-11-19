"use client";

import React from "react";
import { Speaker } from "@/types";
import { UserCheck, Sparkles, Volume2, Video } from "lucide-react";

interface SpeakerSelectorProps {
  speakers: Speaker[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  speakerHeardStats: Record<string, { heard: number; total: number }>;
}

export function SpeakerSelector({
  speakers,
  selectedSlug,
  onSelect,
  speakerHeardStats,
}: SpeakerSelectorProps) {
  // Total across all speakers
  const totalCatalogLectures = speakers.reduce((sum, s) => sum + s.total_lectures, 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Speakers (Alphabetical Roster)
        </h2>
        {selectedSlug && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Show All Speakers
          </button>
        )}
      </div>

      {/* Speaker Badges / Carousel */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
        {/* All Speakers Pill */}
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 snap-start ${
            selectedSlug === null
              ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
              : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <span>All Speakers</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              selectedSlug === null ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-[var(--muted)]"
            }`}
          >
            {totalCatalogLectures}
          </span>
        </button>

        {/* 9 Canonical Speakers */}
        {speakers.map((speaker) => {
          const isSelected = selectedSlug === speaker.slug;
          const stats = speakerHeardStats[speaker.slug] || { heard: 0, total: speaker.total_lectures };
          const initials = speaker.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <button
              key={speaker.slug}
              onClick={() => onSelect(isSelected ? null : speaker.slug)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 snap-start ${
                isSelected
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-semibold"
                  : "bg-[var(--surface)] text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--surface-hover)] hover:border-amber-500/40"
              }`}
            >
              {/* Initials Avatar */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {initials}
              </div>

              <span>{speaker.name}</span>

              {/* Progress / Total Badge */}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : stats.heard > 0
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "bg-black/5 dark:bg-white/10 text-[var(--muted)]"
                }`}
              >
                {stats.heard > 0 ? `${stats.heard}/${speaker.total_lectures}` : speaker.total_lectures}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
