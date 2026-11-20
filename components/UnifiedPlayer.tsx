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
  Loader2,
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
  const [isBuffering, setIsBuffering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentMediaUrlRef = useRef<string | null>(null);
  const initialSeekDoneRef = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);

  const isAudio = currentLecture?.source_type === "audio";
  const ytId =
    currentLecture && !isAudio
      ? currentLecture.yt_id || (currentLecture.id.startsWith("yt:") ? currentLecture.id.replace("yt:", "") : "")
      : "";

  // Reset timestamps when lecture changes
  useEffect(() => {
    setCurrentTime(initialTime);
    setDuration(0);
    initialSeekDoneRef.current = false;
    setIsBuffering(false);
  }, [currentLecture?.id]);

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
  }, [currentLecture?.media_url, isAudio]);

  // Handle audio metadata & canplay to apply initialTime once without resetting the stream
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

  // Helper to send commands to YouTube iframe via postMessage
  const sendYtCommand = (func: string, args: any[] = []) => {
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
  };

  // Immediate progress flush on pause or close
  const flushProgress = () => {
    if (onSaveProgress && currentLecture) {
      const cur = isAudio ? (audioRef.current?.currentTime || currentTime) : currentTime;
      const dur = isAudio ? (audioRef.current?.duration || duration) : duration;
      if (cur > 0) {
        onSaveProgress(currentLecture.id, cur, dur);
        lastSavedTimeRef.current = Date.now();
      }
    }
  };

  const handleClose = () => {
    flushProgress();
    onClose();
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
  }, [isPlaying, isAudio, ytId]);

  // Sync playbackRate
  useEffect(() => {
    if (isAudio && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    } else if (!isAudio && ytId) {
      sendYtCommand("setPlaybackRate", [playbackRate]);
    }
  }, [playbackRate, isAudio, ytId]);

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
  }, [volume, isMuted, isAudio, ytId]);

  // Listen for YouTube iframe events (time update, duration, completion)
  useEffect(() => {
    if (isAudio) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") {
            const cur = data.info.currentTime;
            const dur = data.info.duration || duration;
            setCurrentTime(cur);
            if (typeof dur === "number" && dur > 0) {
              setDuration(dur);
            }
            const now = Date.now();
            if (now - lastSavedTimeRef.current > 5000) {
              lastSavedTimeRef.current = now;
              if (onSaveProgress && currentLecture) {
                onSaveProgress(currentLecture.id, cur, dur);
              }
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
      } catch {
        // Ignore non-json messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAudio, currentLecture?.id, duration, onSaveProgress, onToggleHeard]);

  if (!currentLecture) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current && currentLecture) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      if (dur > 0) {
        setDuration(dur);
      }
      setIsBuffering(false);

      // Throttle progress save to avoid re-rendering loops
      const now = Date.now();
      if (now - lastSavedTimeRef.current > 5000) {
        lastSavedTimeRef.current = now;
        if (onSaveProgress) {
          onSaveProgress(currentLecture.id, cur, dur);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (isAudio && audioRef.current) {
      audioRef.current.currentTime = val;
    } else if (!isAudio && ytId) {
      sendYtCommand("seekTo", [val, true]);
    }
    lastSavedTimeRef.current = 0;
  };

  const skipTime = (seconds: number) => {
    if (isAudio && audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (!isAudio && ytId) {
      const newTime = Math.max(0, currentTime + seconds);
      setCurrentTime(newTime);
      sendYtCommand("seekTo", [newTime, true]);
    }
    lastSavedTimeRef.current = 0;
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
      {/* YouTube Player - Always mounted in DOM for immediate audio playback */}
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
              key={ytId}
              src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1${
                initialTime > 0 ? `&start=${Math.floor(initialTime)}` : ""
              }&origin=${typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : ""}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
                {isPlaying && isBuffering ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
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
            {duration > 0 ? (
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
                {isBuffering && (
                  <span className="text-[10px] text-amber-500 font-sans font-medium flex items-center gap-1 shrink-0">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Buffering
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  {isBuffering
                    ? "Buffering audio stream..."
                    : !isAudio
                    ? "YouTube Audio Stream"
                    : "Connecting audio..."}
                </span>
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
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-all ${
                  showVideoDrawer
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
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
