"use client";

import { useState, useEffect, useCallback } from "react";
import { SadhanaState } from "@/types";

const STORAGE_KEYS = {
  HEARD: "my_hearing_heard_v1",
  STARRED: "my_hearing_starred_v1",
  LAST_PLAYED: "my_hearing_last_played_v1",
  PROGRESS: "my_hearing_progress_v1",
};

export function useSadhana() {
  const [heardIds, setHeardIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, { currentTime: number; duration: number }>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    try {
      const savedHeard = localStorage.getItem(STORAGE_KEYS.HEARD);
      if (savedHeard) {
        setHeardIds(new Set(JSON.parse(savedHeard)));
      }

      const savedStarred = localStorage.getItem(STORAGE_KEYS.STARRED);
      if (savedStarred) {
        setStarredIds(new Set(JSON.parse(savedStarred)));
      }

      const savedLast = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
      if (savedLast) {
        setLastPlayedId(savedLast);
      }

      const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (savedProgress) {
        setProgressMap(JSON.parse(savedProgress));
      }
    } catch (e) {
      console.error("Failed to load sadhana data from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save Heard
  const toggleHeard = useCallback((id: string) => {
    setHeardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.HEARD, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, []);

  // Save Starred
  const toggleStarred = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.STARRED, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  }, []);

  // Save Last Played
  const recordPlay = useCallback((id: string) => {
    setLastPlayedId(id);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, id);
    } catch (e) {}
  }, []);

  // Save Timestamp Progress
  const saveProgress = useCallback((id: string, currentTime: number, duration: number) => {
    setProgressMap((prev) => {
      const next = {
        ...prev,
        [id]: { currentTime, duration, updatedAt: new Date().toISOString() },
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Export data as JSON
  const exportData = useCallback((): string => {
    const backup: SadhanaState = {
      heardIds: Array.from(heardIds),
      starredIds: Array.from(starredIds),
      lastPlayedId,
      progress: progressMap as any,
    };
    return JSON.stringify(backup, null, 2);
  }, [heardIds, starredIds, lastPlayedId, progressMap]);

  // Import data
  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const data: SadhanaState = JSON.parse(jsonStr);
      if (Array.isArray(data.heardIds)) {
        const nextHeard = new Set(data.heardIds);
        setHeardIds(nextHeard);
        localStorage.setItem(STORAGE_KEYS.HEARD, JSON.stringify(Array.from(nextHeard)));
      }
      if (Array.isArray(data.starredIds)) {
        const nextStarred = new Set(data.starredIds);
        setStarredIds(nextStarred);
        localStorage.setItem(STORAGE_KEYS.STARRED, JSON.stringify(Array.from(nextStarred)));
      }
      if (data.lastPlayedId) {
        setLastPlayedId(data.lastPlayedId);
        localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, data.lastPlayedId);
      }
      if (data.progress) {
        setProgressMap(data.progress);
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
      }
      return true;
    } catch (e) {
      console.error("Failed to parse imported sadhana JSON:", e);
      return false;
    }
  }, []);

  return {
    isLoaded,
    heardIds,
    starredIds,
    lastPlayedId,
    progressMap,
    toggleHeard,
    toggleStarred,
    recordPlay,
    saveProgress,
    exportData,
    importData,
    isHeard: (id: string) => heardIds.has(id),
    isStarred: (id: string) => starredIds.has(id),
  };
}
