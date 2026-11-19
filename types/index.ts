export interface Lecture {
  id: string;             // yt:11char or idt:hash or sar:hash
  yt_id?: string;
  title: string;
  speaker: string;
  speaker_slug: string;
  category: string;
  subcategory?: string;
  source_type: 'youtube' | 'audio';
  url: string;
  media_url: string;
  channel?: string;
  duration?: string;
  upload_date?: string;
}

export interface SpeakerCategory {
  name: string;
  count: number;
}

export interface Speaker {
  name: string;
  slug: string;
  description: string;
  total_lectures: number;
  sources: string[];
  categories: SpeakerCategory[];
}

export interface SadhanaState {
  heardIds: string[];
  starredIds: string[];
  lastPlayedId: string | null;
  progress: Record<string, { currentTime: number; duration: number; updatedAt: string }>;
}
