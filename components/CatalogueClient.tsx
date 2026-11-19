"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Speaker, Lecture } from "@/types";
import { Navbar } from "./Navbar";
import { SpeakerSelector } from "./SpeakerSelector";
import { SearchAndFilters } from "./SearchAndFilters";
import { LectureCard } from "./LectureCard";
import { UnifiedPlayer } from "./UnifiedPlayer";
import { SadhanaStatsModal } from "./SadhanaStatsModal";
import { useSadhana } from "@/hooks/useSadhana";
import { Headphones, Sparkles, RotateCcw, Play, Loader2 } from "lucide-react";

interface CatalogueClientProps {
  initialSpeakers: Speaker[];
  initialLectures: Lecture[];
  initialSpeakerSlug: string | null;
}

const BATCH_SIZE = 36;

export function CatalogueClient({
  initialSpeakers,
  initialLectures,
  initialSpeakerSlug,
}: CatalogueClientProps) {
  const {
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
    isHeard,
    isStarred,
  } = useSadhana();

  const [selectedSpeakerSlug, setSelectedSpeakerSlug] = useState<string | null>(initialSpeakerSlug);
  const [lectures, setLectures] = useState<Lecture[]>(initialLectures);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);
  const [speakerCache, setSpeakerCache] = useState<Record<string, Lecture[]>>({
    [initialSpeakerSlug || "all"]: initialLectures,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unheard" | "heard" | "starred">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "youtube" | "audio">("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // When speaker selection changes, load their lectures
  useEffect(() => {
    const key = selectedSpeakerSlug || "all";
    setSelectedCategory("");
    setSelectedSubcategory("");
    setVisibleCount(BATCH_SIZE);

    if (speakerCache[key]) {
      setLectures(speakerCache[key]);
      return;
    }

    setIsLoadingLectures(true);
    const targetUrl = selectedSpeakerSlug
      ? `/data/speakers/${selectedSpeakerSlug}.json`
      : `/data/catalog.json`;

    fetch(targetUrl)
      .then((res) => res.json())
      .then((data: Lecture[]) => {
        setSpeakerCache((prev) => ({ ...prev, [key]: data }));
        setLectures(data);
      })
      .catch((err) => {
        console.error("Failed to load lectures:", err);
      })
      .finally(() => {
        setIsLoadingLectures(false);
      });
  }, [selectedSpeakerSlug]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory("");
    setVisibleCount(BATCH_SIZE);
  };

  const handleSubcategoryChange = (subcat: string) => {
    setSelectedSubcategory(subcat);
    setVisibleCount(BATCH_SIZE);
  };

  // Derive active speaker categories
  const currentSpeaker = useMemo(() => {
    return initialSpeakers.find((s) => s.slug === selectedSpeakerSlug);
  }, [initialSpeakers, selectedSpeakerSlug]);

  const activeCategories = useMemo(() => {
    if (selectedSpeakerSlug) {
      const sp = initialSpeakers.find((s) => s.slug === selectedSpeakerSlug);
      return sp ? sp.categories : [];
    }
    // Global unique categories
    const catMap = new Map<string, number>();
    for (const l of lectures) {
      if (l.category) {
        catMap.set(l.category, (catMap.get(l.category) || 0) + 1);
      }
    }
    return Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedSpeakerSlug, initialSpeakers, lectures]);

  // Derive active subcategories (cascading from selectedCategory if chosen)
  const activeSubcategories = useMemo(() => {
    const subMap = new Map<string, number>();
    for (const l of lectures) {
      if (!l.subcategory) continue;
      if (selectedCategory && l.category !== selectedCategory) continue;
      subMap.set(l.subcategory, (subMap.get(l.subcategory) || 0) + 1);
    }
    return Array.from(subMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lectures, selectedCategory]);

  // Filter lectures based on Search, Status, Source, Category, Subcategory
  const filteredLectures = useMemo(() => {
    let result = lectures;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.speaker.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.subcategory && l.subcategory.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === "unheard") {
      result = result.filter((l) => !heardIds.has(l.id));
    } else if (statusFilter === "heard") {
      result = result.filter((l) => heardIds.has(l.id));
    } else if (statusFilter === "starred") {
      result = result.filter((l) => starredIds.has(l.id));
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((l) => l.source_type === sourceFilter);
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((l) => l.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      result = result.filter((l) => l.subcategory === selectedSubcategory);
    }

    return result;
  }, [lectures, searchQuery, statusFilter, sourceFilter, selectedCategory, selectedSubcategory, heardIds, starredIds]);

  // Find last played lecture for hero resume card
  const lastPlayedLecture = useMemo(() => {
    if (!lastPlayedId) return null;
    return lectures.find((l) => l.id === lastPlayedId) || null;
  }, [lastPlayedId, lectures]);

  // Speaker heard statistics
  const speakerHeardStats = useMemo(() => {
    const stats: Record<string, { heard: number; total: number }> = {};
    for (const sp of initialSpeakers) {
      stats[sp.slug] = { heard: 0, total: sp.total_lectures };
    }
    return stats;
  }, [initialSpeakers]);

  // Play a lecture
  const handlePlayLecture = (lecture: Lecture) => {
    if (currentLecture?.id === lecture.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentLecture(lecture);
      setIsPlaying(true);
      recordPlay(lecture.id);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setCurrentLecture(null);
  };

  const totalCatalogLectures = initialSpeakers.reduce((sum, s) => sum + s.total_lectures, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Navbar */}
      <Navbar
        heardCount={heardIds.size}
        starredCount={starredIds.size}
        totalCount={totalCatalogLectures}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Continue Hearing Hero Banner (if last played exists) */}
        {lastPlayedLecture && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600/15 via-amber-500/10 to-transparent p-5 border border-amber-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-900 border border-amber-500/30 shrink-0 shadow-md flex items-center justify-center">
                {lastPlayedLecture.source_type !== "audio" && (lastPlayedLecture.yt_id || lastPlayedLecture.id.startsWith("yt:")) ? (
                  <img
                    src={`https://i.ytimg.com/vi/${lastPlayedLecture.yt_id || lastPlayedLecture.id.replace("yt:", "")}/mqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-500 text-white flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Continue Hearing
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] line-clamp-1">
                  {lastPlayedLecture.title}
                </h3>
                <p className="text-xs text-[var(--muted)] line-clamp-1">
                  {lastPlayedLecture.speaker} • {lastPlayedLecture.category}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayLecture(lastPlayedLecture)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          </div>
        )}

        {/* Alphabetical Speaker Roster */}
        <SpeakerSelector
          speakers={initialSpeakers}
          selectedSlug={selectedSpeakerSlug}
          onSelect={(slug) => setSelectedSpeakerSlug(slug)}
          speakerHeardStats={speakerHeardStats}
        />

        {/* Search, Filter Pills, Category & Subcategory Dropdowns */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={activeCategories}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={handleSubcategoryChange}
          subcategories={activeSubcategories}
          isSNS={selectedSpeakerSlug === "sacinandana-swami"}
          totalFiltered={filteredLectures.length}
        />

        {/* Lectures Grid with Loading and Empty States */}
        {isLoadingLectures ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Loading spiritual katha...</p>
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl border border-dashed border-[var(--card-border)] bg-[var(--surface)]/50">
            <Headphones className="w-12 h-12 text-[var(--muted)] mb-3 opacity-40" />
            <h3 className="font-semibold text-base text-[var(--foreground)]">No Lectures Found</h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mt-1">
              Try adjusting your search query, filters, or select a different speaker from the roster.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSourceFilter("all");
                setSelectedCategory("");
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLectures.slice(0, visibleCount).map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  isPlaying={isPlaying && currentLecture?.id === lecture.id}
                  isCurrent={currentLecture?.id === lecture.id}
                  isHeard={isHeard(lecture.id)}
                  isStarred={isStarred(lecture.id)}
                  onPlay={handlePlayLecture}
                  onToggleHeard={toggleHeard}
                  onToggleStarred={toggleStarred}
                  onSelectCategory={setSelectedCategory}
                />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredLectures.length && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold border border-[var(--card-border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] shadow-xs hover:border-amber-500/50 transition-all"
                >
                  Load More Lectures ({filteredLectures.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Unified Bottom Player */}
      <UnifiedPlayer
        currentLecture={currentLecture}
        isPlaying={isPlaying}
        isHeard={currentLecture ? isHeard(currentLecture.id) : false}
        onTogglePlay={handleTogglePlay}
        onToggleHeard={toggleHeard}
        onClose={handleClosePlayer}
        onSaveProgress={saveProgress}
        initialTime={currentLecture ? progressMap[currentLecture.id]?.currentTime || 0 : 0}
      />

      {/* Sadhana Statistics & Backup Modal */}
      <SadhanaStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        speakers={initialSpeakers}
        heardIds={heardIds}
        starredIds={starredIds}
        onExport={exportData}
        onImport={importData}
      />
    </div>
  );
}
