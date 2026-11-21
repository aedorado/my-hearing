"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

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

// Parse "HH:MM:SS" or "MM:SS" into seconds
function parseDurationToSeconds(durStr?: string): number {
  if (!durStr) return 0;
  const parts = durStr.trim().split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

// Format seconds into "HH:MM:SS" or "M:SS"
function formatTime(seconds: number, forceHours = false): string {
  if (isNaN(seconds) || seconds < 0) return forceHours ? "0:00:00" : "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0 || forceHours) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [isBuffering, setIsBuffering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const currentMediaUrlRef = useRef<string | null>(null);
  const initialSeekDoneRef = useRef(false);
  const isSeekingRef = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);

  const isAudio = currentLecture?.source_type === "audio";
  const ytId =
    currentLecture && !isAudio
      ? currentLecture.yt_id || (currentLecture.id.startsWith("yt:") ? currentLecture.id.replace("yt:", "") : "")
      : "";

  // Reset & preload duration whenever current lecture changes
  useEffect(() => {
    setCurrentTime(initialTime);
    const parsedDur = parseDurationToSeconds(currentLecture?.duration);
    setDuration(parsedDur);
    initialSeekDoneRef.current = false;
    setIsBuffering(false);
  }, [currentLecture?.id, currentLecture?.duration, initialTime]);

  // Load YouTube IFrame API script once globally
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) return;

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Audio HTML5 setup - Only re-run when media URL changes to prevent stream interruptions!
  useEffect(() => {
    if (!isAudio || !audioRef.current || !currentLecture) return;
    const audio = audioRef.current;

    if (currentMediaUrlRef.current !== currentLecture.media_url) {
      currentMediaUrlRef.current = currentLecture.media_url;
      initialSeekDoneRef.current = false;
      setIsBuffering(true);
      audio.src = currentLecture.media_url;
      audio.load();
      audio.playbackRate = playbackRate;
    }
  }, [currentLecture?.media_url, isAudio, playbackRate]);

  // Handle audio metadata & canplay to apply initialTime once
  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || 0;
    if (dur > 0) setDuration(dur);
    if (!initialSeekDoneRef.current && initialTime > 0 && dur > 0) {
      audioRef.current.currentTime = Math.min(initialTime, dur);
      initialSeekDoneRef.current = true;
    }
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
    if (!initialSeekDoneRef.current && initialTime > 0 && audioRef.current && audioRef.current.duration > 0) {
      audioRef.current.currentTime = Math.min(initialTime, audioRef.current.duration);
      initialSeekDoneRef.current = true;
    }
  };

  // Helper to send commands to YouTube iframe via postMessage fallback
  const sendYtCommand = useCallback((func: string, args: any[] = []) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current[func] === "function") {
      try {
        ytPlayerRef.current[func](...args);
        return;
      } catch {}
    }
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: func,
          args: args,
        }),
        "*"
      );
    }
  }, []);

  // Flush progress immediately
  const flushProgress = useCallback(() => {
    if (onSaveProgress && currentLecture) {
      const cur = isAudio ? (audioRef.current?.currentTime || currentTime) : currentTime;
      const dur = isAudio ? (audioRef.current?.duration || duration) : duration;
      if (cur > 0) {
        onSaveProgress(currentLecture.id, cur, dur);
        lastSavedTimeRef.current = Date.now();
      }
    }
  }, [currentLecture, isAudio, currentTime, duration, onSaveProgress]);

  const handleClose = () => {
    flushProgress();
    onClose();
  };

  // Initialize YT.Player on iframe load
  const handleIframeLoad = () => {
    // Send postMessage listening handshake
    if (ytIframeRef.current?.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "listening" }),
        "*"
      );
    }

    // Bind official YT.Player if available
    if (window.YT && window.YT.Player && ytIframeRef.current) {
      try {
        ytPlayerRef.current = new window.YT.Player(ytIframeRef.current, {
          events: {
            onReady: (event: any) => {
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
              if (initialTime > 0) {
                event.target.seekTo(initialTime, true);
              }
              if (isPlaying) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              // 1: PLAYING, 2: PAUSED, 3: BUFFERING, 0: ENDED
              if (event.data === 1) {
                setIsBuffering(false);
                const dur = event.target.getDuration();
                if (dur > 0) setDuration(dur);
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                flushProgress();
                if (currentLecture) onToggleHeard(currentLecture.id);
              }
            },
          },
        });
      } catch (e) {
        console.warn("Could not bind YT.Player to iframe:", e);
      }
    }
  };

  // Sync play/pause state for both audio and YouTube
  useEffect(() => {
    if (isAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio playback interrupted or awaiting gesture:", err);
        });
      } else {
        audioRef.current.pause();
        flushProgress();
      }
    } else if (!isAudio && ytId) {
      if (isPlaying) {
        sendYtCommand("playVideo");
      } else {
        sendYtCommand("pauseVideo");
        flushProgress();
      }
    }
  }, [isPlaying, isAudio, ytId, sendYtCommand, flushProgress]);

  // Sync playbackRate
  useEffect(() => {
    if (isAudio && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    } else if (!isAudio && ytId) {
      sendYtCommand("setPlaybackRate", [playbackRate]);
    }
  }, [playbackRate, isAudio, ytId, sendYtCommand]);

  // Sync volume and mute
  useEffect(() => {
    if (isAudio && audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    } else if (!isAudio && ytId) {
      if (isMuted) {
        sendYtCommand("mute");
      } else {
        sendYtCommand("unMute");
        sendYtCommand("setVolume", [Math.round(volume * 100)]);
      }
    }
  }, [volume, isMuted, isAudio, ytId, sendYtCommand]);

  // High-reliability playback ticker for YouTube mode
  useEffect(() => {
    if (isAudio || !isPlaying) return;

    const interval = setInterval(() => {
      if (isSeekingRef.current) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (typeof cur === "number" && !isNaN(cur)) {
            setCurrentTime(cur);
            const now = Date.now();
            if (now - lastSavedTimeRef.current > 5000 && currentLecture) {
              lastSavedTimeRef.current = now;
              onSaveProgress?.(currentLecture.id, cur, dur || duration);
            }
          }
          if (typeof dur === "number" && dur > 0 && !isNaN(dur)) {
            setDuration(dur);
          }
          return;
        } catch {}
      }

      // Smooth fallback increment if YT.Player is not responding
      setCurrentTime((prev) => {
        const next = prev + 0.5 * playbackRate;
        return duration > 0 ? Math.min(duration, next) : next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isAudio, isPlaying, playbackRate, duration, currentLecture, onSaveProgress]);

  // PostMessage listener fallback for YouTube iframe
  useEffect(() => {
    if (isAudio) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number" && !isSeekingRef.current) {
            const cur = data.info.currentTime;
            const dur = data.info.duration || duration;
            setCurrentTime(cur);
            if (typeof dur === "number" && dur > 0) {
              setDuration(dur);
            }
            const now = Date.now();
            if (now - lastSavedTimeRef.current > 5000 && currentLecture) {
              lastSavedTimeRef.current = now;
              onSaveProgress?.(currentLecture.id, cur, dur);
            }
          }
          if (typeof data.info.duration === "number" && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState === 0 && currentLecture) {
            flushProgress();
            onToggleHeard(currentLecture.id);
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAudio, currentLecture, duration, onSaveProgress, onToggleHeard, flushProgress]);

  if (!currentLecture) return null;

  // HTML5 audio onTimeUpdate handler
  const handleTimeUpdate = () => {
    if (audioRef.current && currentLecture && !isSeekingRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      if (dur > 0) {
        setDuration(dur);
      }
      setIsBuffering(false);

      const now = Date.now();
      if (now - lastSavedTimeRef.current > 5000) {
        lastSavedTimeRef.current = now;
        onSaveProgress?.(currentLecture.id, cur, dur);
      }
    }
  };

  // Direct Seek to absolute timestamp
  const handleSeek = (val: number) => {
    const target = Math.max(0, duration > 0 ? Math.min(duration, val) : val);
    setCurrentTime(target);

    if (isAudio && audioRef.current) {
      audioRef.current.currentTime = target;
    } else if (!isAudio) {
      let seekDone = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        try {
          ytPlayerRef.current.seekTo(target, true);
          seekDone = true;
        } catch {}
      }
      if (!seekDone) {
        sendYtCommand("seekTo", [target, true]);
      }
    }
    lastSavedTimeRef.current = 0;
  };

  // Slider change while dragging
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    isSeekingRef.current = true;
    setCurrentTime(val);
  };

  // Slider release / commit
  const handleSeekCommit = (val: number) => {
    isSeekingRef.current = false;
    handleSeek(val);
  };

  // Skip relative ± seconds
  const skipTime = (seconds: number) => {
    const cur = currentTime;
    const maxDur = duration > 0 ? duration : Infinity;
    const newTime = Math.max(0, Math.min(maxDur, cur + seconds));
    handleSeek(newTime);
  };

  // Click on the top micro-progress bar
  const handleTopBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(fraction * duration);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const hasHours = duration >= 3600;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
      {/* YouTube Player - Mounted in DOM for audio playback, expands in video mode */}
      {!isAudio && ytId && (
        <div
          className={`transition-all duration-300 ${
            showVideoDrawer
              ? "block max-w-4xl mx-auto bg-black rounded-t-2xl overflow-hidden shadow-2xl border-t border-x border-amber-500/30 opacity-100 pointer-events-auto"
              : "fixed bottom-[80px] right-4 w-[320px] h-[180px] opacity-0 pointer-events-none -z-50"
          }`}
        >
          {showVideoDrawer && (
            <div className="bg-stone-900 px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-1.5 font-medium text-amber-400">
                <Video className="w-3.5 h-3.5" /> Video Mode
              </span>
              <button
                onClick={() => setShowVideoDrawer(false)}
                className="hover:text-white transition-colors flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200"
              >
                <span>Switch to Audio Only</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div key="yt-iframe-container" className="relative aspect-video w-full bg-black">
            <iframe
              ref={ytIframeRef}
              id="unified-yt-iframe"
              key={ytId}
              src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1${
                initialTime > 0 ? `&start=${Math.floor(initialTime)}` : ""
              }&origin=${typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : ""}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      )}

      {/* Hidden Native Audio Element for MP3 Sources */}
      {isAudio && (
        <audio
          ref={audioRef}
          preload="auto"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onPlaying={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onStalled={() => setIsBuffering(true)}
          onError={() => {
            setIsBuffering(false);
            console.error("Audio streaming error on URL:", currentLecture.media_url);
          }}
          onEnded={() => {
            flushProgress();
            if (currentLecture) onToggleHeard(currentLecture.id);
          }}
        />
      )}

      {/* Sleek Top Edge Full-Width Micro-Scrubber Line (Zero Bulk, 1-Click Seek Anywhere) */}
      <div
        className="group/topbar relative w-full h-1 hover:h-2 cursor-pointer transition-all z-20 -mb-1"
        onClick={handleTopBarClick}
        title={duration > 0 ? `Click to seek anywhere (${formatTime(currentTime)} / ${formatTime(duration)})` : "Streaming..."}
      >
        <div className="w-full h-full bg-stone-300/40 dark:bg-stone-700/40 overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-100 relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs opacity-0 group-hover/topbar:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Main Sticky Bottom Player Bar */}
      <div className="bg-[var(--surface)] border-t border-[var(--card-border)] shadow-2xl px-4 py-2.5 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
          
          {/* 1. Left: Lecture Metadata */}
          <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
            {/* Thumbnail or Audio Icon */}
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-stone-900 border border-[var(--card-border)] flex items-center justify-center shadow-xs">
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
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] truncate">
                <span className="font-medium text-amber-600 dark:text-amber-400 truncate">{currentLecture.speaker}</span>
                <span>•</span>
                <span className="truncate">{currentLecture.category}</span>
                {!isAudio && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600/80 dark:text-amber-400/80 shrink-0 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      YT Audio
                    </span>
                  </>
                )}
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

          {/* 2. Center: Controls & Audio Seek Bar (Compact, Non-Bulky, Devotional) */}
          <div className="flex flex-col items-center gap-1 w-full md:w-5/12 max-w-md">
            {/* Playback Trigger Buttons */}
            <div className="flex items-center gap-4">
              {/* Rewind 10s */}
              <button
                onClick={() => skipTime(-10)}
                title="Rewind 10s"
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Play / Pause Main Trigger */}
              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 transition-transform active:scale-95"
              >
                {isPlaying && isBuffering ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => skipTime(10)}
                title="Forward 10s"
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all active:scale-95"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Seek Scrubber & Precision Timestamps */}
            <div className="flex items-center gap-2 w-full text-[10px] sm:text-[11px] text-[var(--muted)] font-mono select-none">
              {/* Current Elapsed Time */}
              <span className="w-10 sm:w-12 text-right shrink-0 tabular-nums font-medium">
                {formatTime(currentTime, hasHours)}
              </span>

              {/* Range Slider with Dynamic Amber Fill */}
              <div className="relative flex-1 flex items-center group py-0.5">
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="1"
                  value={currentTime}
                  onChange={handleSeekChange}
                  onMouseDown={() => { isSeekingRef.current = true; }}
                  onMouseUp={(e) => handleSeekCommit(parseFloat((e.target as HTMLInputElement).value))}
                  onTouchStart={() => { isSeekingRef.current = true; }}
                  onTouchEnd={(e) => handleSeekCommit(parseFloat((e.target as HTMLInputElement).value))}
                  className="audio-seek-slider w-full h-1 group-hover:h-1.5 rounded-full appearance-none cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progressPercent}%, var(--card-border) ${progressPercent}%, var(--card-border) 100%)`,
                  }}
                  title={duration > 0 ? `Seek (${formatTime(currentTime)} / ${formatTime(duration)})` : "Connecting audio..."}
                />
              </div>

              {/* Total Duration or Buffering status */}
              <span className="w-10 sm:w-12 text-left shrink-0 tabular-nums font-medium flex items-center gap-1">
                {duration > 0 ? (
                  formatTime(duration, hasHours)
                ) : (
                  <span className="text-[10px] text-amber-500 font-sans flex items-center gap-1 font-medium">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Live
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 3. Right: Tools (Speed, Volume, Video Drawer, External, Close) */}
          <div className="flex items-center justify-end gap-1.5 w-full md:w-1/3">
            {/* Playback Rate */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="text-xs bg-[var(--surface-hover)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-[var(--foreground)] focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Volume / Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className={`p-1.5 rounded-lg transition-colors ${
                isMuted
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Video Drawer Toggle for YouTube */}
            {!isAudio && (
              <button
                onClick={() => setShowVideoDrawer(!showVideoDrawer)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-medium border transition-all ${
                  showVideoDrawer
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-[var(--surface-hover)] border-[var(--card-border)] text-[var(--foreground)] hover:border-amber-500/50"
                }`}
                title={showVideoDrawer ? "Switch to Audio-Only Mode" : "Show Video"}
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showVideoDrawer ? "Hide Video" : "Show Video"}</span>
                <span className="sm:hidden">Video</span>
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
              onClick={handleClose}
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
