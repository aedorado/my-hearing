"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lecture } from "@/types";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Video,
  Music2,
} from "lucide-react";

interface UnifiedPlayerProps {
  currentLecture: Lecture | null;
  isPlaying: boolean;
  isHeard: boolean;
  onTogglePlay: () => void;
  onToggleHeard: (id: string) => void;
  onClose: () => void;
  onSaveProgress?: (id: string, currentTime: number, duration: number) => void;
  initialTime?: number;
}

export function UnifiedPlayer({
  currentLecture,
  isPlaying,
  isHeard,
  onTogglePlay,
  onToggleHeard,
  onClose,
  onSaveProgress,
  initialTime = 0,
}: UnifiedPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVideoDrawer, setShowVideoDrawer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isAudio = currentLecture?.source_type === "audio";

  // Reset timestamps when lecture changes
  useEffect(() => {
    setCurrentTime(initialTime);
    setDuration(0);
  }, [currentLecture?.id]);

  // Audio HTML5 setup
  useEffect(() => {
    if (!isAudio || !audioRef.current || !currentLecture) return;
    const audio = audioRef.current;
    audio.src = currentLecture.media_url;
    audio.playbackRate = playbackRate;
    if (initialTime > 0) {
      audio.currentTime = initialTime;
    }
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentLecture?.id, isAudio]);

  // Sync play/pause state for audio
  useEffect(() => {
    if (isAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isAudio]);

  // Sync playbackRate
  useEffect(() => {
    if (isAudio && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isAudio]);

  // Sync volume
  useEffect(() => {
    if (isAudio && audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isAudio]);

  if (!currentLecture) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);
      if (onSaveProgress && currentLecture) {
        onSaveProgress(currentLecture.id, cur, dur);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (isAudio && audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skipTime = (seconds: number) => {
    if (isAudio && audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Expandable YouTube Video Drawer */}
      {!isAudio && showVideoDrawer && (
        <div className="max-w-4xl mx-auto bg-black rounded-t-2xl overflow-hidden shadow-2xl border-t border-x border-amber-500/30">
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${currentLecture.yt_id}?autoplay=1&enablejsapi=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Hidden Native Audio Element */}
      {isAudio && (
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => {
            if (currentLecture) onToggleHeard(currentLecture.id);
          }}
        />
      )}

      {/* Main Sticky Bottom Player Bar */}
      <div className="bg-[var(--surface)] border-t border-[var(--card-border)] shadow-2xl px-4 py-3 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Lecture Metadata */}
          <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
            {/* Thumbnail or Audio Icon */}
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-stone-900 border border-[var(--card-border)] flex items-center justify-center shadow-xs">
              {!isAudio && (currentLecture.yt_id || currentLecture.id.startsWith("yt:")) ? (
                <img
                  src={`https://i.ytimg.com/vi/${currentLecture.yt_id || currentLecture.id.replace("yt:", "")}/mqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Music2 className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate" title={currentLecture.title}>
                {currentLecture.title}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] truncate">
                <span className="font-medium text-amber-600 dark:text-amber-400">{currentLecture.speaker}</span>
                <span>•</span>
                <span className="truncate">{currentLecture.category}</span>
              </div>
            </div>

            {/* Heard Toggle */}
            <button
              onClick={() => onToggleHeard(currentLecture.id)}
              title={isHeard ? "Marked as Heard" : "Mark as Heard"}
              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                isHeard
                  ? "text-emerald-500 bg-emerald-500/10"
                  : "text-[var(--muted)] hover:text-emerald-500 hover:bg-[var(--surface-hover)]"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isHeard ? "fill-emerald-500/20" : ""}`} />
            </button>
          </div>

          {/* Center Playback Controls */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-1/3">
            <div className="flex items-center gap-4">
              {/* Rewind 10s */}
              <button
                onClick={() => skipTime(-10)}
                title="Rewind 10s"
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause Main Trigger */}
              <button
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => skipTime(10)}
                title="Forward 10s"
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber & Timestamps */}
            {isAudio && duration > 0 && (
              <div className="flex items-center gap-2 w-full max-w-sm text-[11px] text-[var(--muted)] font-mono">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-[var(--card-border)] rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Right Tools: Speed, Volume, Toggle Video Drawer, Close */}
          <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
            {/* Playback Rate */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="text-xs bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-[var(--foreground)] focus:outline-none focus:border-amber-500"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Video Drawer Toggle for YouTube */}
            {!isAudio && (
              <button
                onClick={() => setShowVideoDrawer(!showVideoDrawer)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface-hover)] hover:border-amber-500 text-[var(--foreground)] transition-all"
              >
                <span>Video</span>
                {showVideoDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* External Link */}
            <a
              href={currentLecture.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open source"
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close player"
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
