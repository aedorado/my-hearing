"use client";

import React, { useState } from "react";
import { Lecture } from "@/types";
import {
  Play,
  Pause,
  CheckCircle2,
  Star,
  ExternalLink,
  Video,
  Music2,
  Clock,
  Radio,
  Sparkles,
} from "lucide-react";

interface LectureCardProps {
  lecture: Lecture;
  isPlaying: boolean;
  isCurrent: boolean;
  isHeard: boolean;
  isStarred: boolean;
  onPlay: (lecture: Lecture) => void;
  onToggleHeard: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onSelectCategory?: (category: string) => void;
}

export function LectureCard({
  lecture,
  isPlaying,
  isCurrent,
  isHeard,
  isStarred,
  onPlay,
  onToggleHeard,
  onToggleStarred,
  onSelectCategory,
}: LectureCardProps) {
  const isAudio = lecture.source_type === "audio";
  const ytId = lecture.yt_id || (lecture.id.startsWith("yt:") ? lecture.id.replace("yt:", "") : "");
  
  // High quality YouTube thumbnail with fallback to mqdefault
  const [thumbSrc, setThumbSrc] = useState(
    ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : ""
  );

  const handleImageError = () => {
    if (ytId && !thumbSrc.includes("mqdefault")) {
      setThumbSrc(`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`);
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden ${
        isCurrent
          ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
          : isHeard
          ? "border-[var(--card-border)] bg-[var(--surface)] opacity-80 hover:opacity-100 hover:border-amber-500/40"
          : "border-[var(--card-border)] bg-[var(--surface)] hover:border-amber-500/50 hover:shadow-md"
      }`}
    >
      <div>
        {/* Visual Cover / Thumbnail Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
          {/* YouTube Thumbnail */}
          {!isAudio && thumbSrc ? (
            <img
              src={thumbSrc}
              alt={lecture.title}
              onError={handleImageError}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            /* Devotional Cover for Direct Audio (IDT / Saranagati) */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-950/60 via-stone-900 to-amber-900/40 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--accent)_0,transparent_70%)]" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-2 shadow-inner">
                <Music2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-amber-400/90 tracking-wide line-clamp-1 max-w-[85%]">
                {lecture.speaker}
              </span>
              <span className="text-[10px] text-stone-400 line-clamp-1 max-w-[80%] mt-0.5">
                {lecture.category}
              </span>
            </div>
          )}

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Top Overlays: Source Badge & Actions */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            {/* Source Type Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase backdrop-blur-md shadow-sm ${
                isAudio
                  ? "bg-blue-600/80 text-white border border-blue-400/30"
                  : "bg-red-600/85 text-white border border-red-400/30"
              }`}
            >
              {isAudio ? <Music2 className="w-3 h-3" /> : <Video className="w-3 h-3" />}
              <span>{isAudio ? "Audio MP3" : "YouTube"}</span>
            </span>

            {/* Quick Action Buttons (Star & Heard) */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStarred(lecture.id);
                }}
                title={isStarred ? "Remove Star" : "Star this lecture"}
                className={`p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm ${
                  isStarred
                    ? "bg-amber-500 text-white"
                    : "bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHeard(lecture.id);
                }}
                title={isHeard ? "Mark as Unheard" : "Mark as Heard"}
                className={`p-1.5 rounded-lg backdrop-blur-md transition-all shadow-sm ${
                  isHeard
                    ? "bg-emerald-600 text-white"
                    : "bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isHeard ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Bottom Overlays: Duration & Play Trigger Overlay */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            {isCurrent && isPlaying ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-md animate-pulse">
                <Radio className="w-3 h-3 animate-spin" />
                <span>Now Playing</span>
              </span>
            ) : (
              <span />
            )}

            {lecture.duration && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-black/75 text-white/95 backdrop-blur-md">
                <Clock className="w-3 h-3" />
                <span>{lecture.duration}</span>
              </span>
            )}
          </div>

          {/* Hover Play Button Overlay */}
          <button
            onClick={() => onPlay(lecture)}
            aria-label={`Play ${lecture.title}`}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 backdrop-blur-[2px] transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/40 transform scale-90 group-hover:scale-100 transition-transform">
              {isCurrent && isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </div>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4">
          {/* Title */}
          <h3
            className={`font-semibold text-sm leading-snug line-clamp-2 mb-2 transition-colors ${
              isCurrent ? "text-amber-600 dark:text-amber-400" : "text-[var(--foreground)]"
            }`}
            title={lecture.title}
          >
            {lecture.title}
          </h3>

          {/* Meta: Speaker & Category / Subcategory */}
          <div className="space-y-1.5 text-xs text-[var(--muted)]">
            <div className="font-medium text-amber-700/90 dark:text-amber-400/90 line-clamp-1">
              {lecture.speaker}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {onSelectCategory ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(lecture.category);
                  }}
                  title={`Filter by ${lecture.category}`}
                  className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-[var(--muted)] line-clamp-1 border border-[var(--card-border)]/50 transition-colors text-left"
                >
                  {lecture.category}
                </button>
              ) : (
                <div className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] text-[var(--muted)] line-clamp-1 border border-[var(--card-border)]/50">
                  {lecture.category}
                </div>
              )}

              {lecture.subcategory && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)]/70 text-[var(--muted)] line-clamp-1 border border-[var(--card-border)]/40 text-[10px]">
                  {lecture.subcategory}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Play Action & External Source Link */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-[var(--card-border)]/40">
        <button
          onClick={() => onPlay(lecture)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            isCurrent && isPlaying
              ? "bg-amber-600 text-white shadow-amber-500/30"
              : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
          }`}
        >
          {isCurrent && isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCurrent ? "Resume" : "Hear"}</span>
            </>
          )}
        </button>

        <a
          href={lecture.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open original source"
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
