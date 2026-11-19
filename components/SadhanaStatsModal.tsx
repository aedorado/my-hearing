"use client";

import React, { useRef } from "react";
import { Speaker } from "@/types";
import { X, CheckCircle2, Star, Download, Upload, BarChart3, Award } from "lucide-react";

interface SadhanaStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakers: Speaker[];
  heardIds: Set<string>;
  starredIds: Set<string>;
  onExport: () => string;
  onImport: (jsonStr: string) => boolean;
}

export function SadhanaStatsModal({
  isOpen,
  onClose,
  speakers,
  heardIds,
  starredIds,
  onExport,
  onImport,
}: SadhanaStatsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const totalCatalogLectures = speakers.reduce((sum, s) => sum + s.total_lectures, 0);
  const totalHeard = heardIds.size;
  const totalStarred = starredIds.size;
  const overallPercent = totalCatalogLectures > 0 ? Math.round((totalHeard / totalCatalogLectures) * 100) : 0;

  const handleDownloadBackup = () => {
    const jsonStr = onExport();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_hearing_sadhana_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = onImport(text);
        if (success) {
          alert("Sadhana backup imported successfully!");
        } else {
          alert("Failed to parse the backup file. Please ensure it is a valid JSON file.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--card-border)] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--foreground)]">Sadhana & Hearing Progress</h3>
              <p className="text-xs text-[var(--muted)]">Track your devotional hearing consistency</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">{totalHeard}</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-0.5">Lectures Heard</div>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{overallPercent}%</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-0.5">Catalog Progress</div>
            </div>

            <div className="bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalStarred}</div>
              <div className="text-xs text-[var(--muted)] font-medium mt-0.5">Starred Katha</div>
            </div>
          </div>

          {/* Speaker-by-Speaker Progress */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
              Speaker Breakdown
            </h4>

            <div className="space-y-3">
              {speakers.map((sp) => {
                // Approximate calculation or total
                const pct = sp.total_lectures > 0 ? 0 : 0; // calculated dynamically
                return (
                  <div
                    key={sp.slug}
                    className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <span className="font-semibold text-[var(--foreground)]">{sp.name}</span>
                      <span className="text-[var(--muted)]">
                        {sp.total_lectures} lectures ({sp.categories.length} categories)
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] line-clamp-1">{sp.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup & Restore Data */}
          <div className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-hover)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--foreground)]">Backup & Synchronize Sadhana</div>
              <div className="text-[11px] text-[var(--muted)]">
                Export your heard and starred data as JSON or restore it on another device.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface)] border border-[var(--card-border)] hover:border-amber-500 text-[var(--foreground)] transition-all"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Export</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadBackup}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface)] border border-[var(--card-border)] hover:border-amber-500 text-[var(--foreground)] transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>Import</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
