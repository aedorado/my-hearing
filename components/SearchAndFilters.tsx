"use client";

import React from "react";
import { Search, X, CheckCircle2, Star, Video, Music2, Layers, Folder, Calendar } from "lucide-react";
import { SpeakerCategory } from "@/types";

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: "all" | "unheard" | "heard" | "starred";
  onStatusChange: (status: "all" | "unheard" | "heard" | "starred") => void;
  sourceFilter: "all" | "youtube" | "audio";
  onSourceChange: (source: "all" | "youtube" | "audio") => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: SpeakerCategory[];
  selectedSubcategory: string;
  onSubcategoryChange: (subcat: string) => void;
  subcategories: SpeakerCategory[];
  isSNS: boolean;
  totalFiltered: number;
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedSubcategory,
  onSubcategoryChange,
  subcategories,
  isSNS,
  totalFiltered,
}: SearchAndFiltersProps) {
  return (
    <div className="space-y-3 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
      {/* Top Search Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, topic, verse, or speaker..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-[var(--surface-hover)] border border-[var(--card-border)] focus:border-amber-500 focus:outline-none text-[var(--foreground)] placeholder-[var(--muted)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 p-1 rounded-full text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 1: Status & Source Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status Pills */}
          <div className="flex rounded-lg bg-[var(--surface-hover)] p-0.5 border border-[var(--card-border)]">
            <button
              onClick={() => onStatusChange("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === "all"
                  ? "bg-amber-500 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onStatusChange("unheard")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === "unheard"
                  ? "bg-amber-500 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Unheard
            </button>
            <button
              onClick={() => onStatusChange("heard")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === "heard"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Heard</span>
            </button>
            <button
              onClick={() => onStatusChange("starred")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === "starred"
                  ? "bg-amber-500 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Starred</span>
            </button>
          </div>

          {/* Source Type Pills */}
          <div className="flex rounded-lg bg-[var(--surface-hover)] p-0.5 border border-[var(--card-border)]">
            <button
              onClick={() => onSourceChange("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                sourceFilter === "all"
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs font-semibold"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onSourceChange("youtube")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                sourceFilter === "youtube"
                  ? "bg-red-500 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Video className="w-3 h-3" />
              <span>YouTube</span>
            </button>
            <button
              onClick={() => onSourceChange("audio")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                sourceFilter === "audio"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Music2 className="w-3 h-3" />
              <span>Audio MP3</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-[var(--muted)] font-medium">
          Showing <span className="text-[var(--foreground)] font-semibold">{totalFiltered}</span> lectures
        </div>
      </div>

      {/* Row 2: Category & Subcategory Dropdowns */}
      {(categories.length > 0 || subcategories.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--card-border)]/60">
          {/* Category / Series / Year Dropdown */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-1 min-w-[220px] sm:max-w-xs">
              <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1 shrink-0">
                {isSNS ? <Calendar className="w-3.5 h-3.5 text-amber-500" /> : <Layers className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isSNS ? "Year:" : "Series:"}</span>
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full text-xs bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-amber-500 font-medium truncate"
              >
                <option value="">
                  {isSNS ? `All Years (${categories.length})` : `All Playlists & Series (${categories.length})`}
                </option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {isSNS ? `Year ${c.name}` : c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subcategory Dropdown */}
          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 flex-1 min-w-[220px] sm:max-w-xs">
              <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1 shrink-0">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Section:</span>
              </span>
              <select
                value={selectedSubcategory}
                onChange={(e) => onSubcategoryChange(e.target.value)}
                className="w-full text-xs bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-amber-500 font-medium truncate"
              >
                <option value="">All Subcategories ({subcategories.length})</option>
                {subcategories.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset button when any dropdown is selected */}
          {(selectedCategory || selectedSubcategory) && (
            <button
              onClick={() => {
                onCategoryChange("");
                onSubcategoryChange("");
              }}
              className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium px-2 py-1"
            >
              <span>Reset Dropdowns</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
