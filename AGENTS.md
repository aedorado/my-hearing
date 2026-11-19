# 🤖 AGENTS.md — Developer & AI Assistant System Manual

Welcome to **My Hearing** — a dedicated personal hearing portal and sadhana katha catalogue. This document specifies system invariants, data contracts, onboarding automation, and developer rules for AI agents and human contributors.

---

## 1. System Vision & Architectural Invariants

### 1.1 The 9 Canonical Speakers (Strict Alphabetical Roster)
All UI elements, dropdowns, selector carousels, and indexes **MUST** preserve this exact alphabetical order:

1. **Amarendra Das** (`amarendra-das`) — Inspiring Bhagavad Gita & Srimad Bhagavatam discourses.
2. **Balaram Shakti Das** (`balaram-shakti-das`) — In-depth Sandarbha and Gaudiya Vaishnava philosophy.
3. **Bhurijana Das** (`bhurijana-das`) — Classic ISKCON teacher, author, and Bhagavat Subodhini seminars.
4. **Hari Parshad Das** (`hari-parshad-das`) — Scholarly Vaishnava katha, Upadeshamrita & Caitanya Caritamrta.
5. **Indradyumna Swami** (`indradyumna-swami`) — Vrindavan Parikrama, Polish Tour, kirtans and nectar discourses.
6. **Madhavananda Das** (`madhavananda-das`) — Gopal Jiu Publications, Sri Jagannath & Gour Govinda Swami katha.
7. **Radha Govinda Das Goswami** (`radha-govinda-das-goswami`) — Soul-stirring Srimad Bhagavatam Saptah & Krishna lila katha.
8. **Radhika Raman Das** (`radhika-raman-das`) — Bhagavata Podcast, Gita insights, and academic Vaishnavism.
9. **Sacinandana Swami** (`sacinandana-swami`) — Saranagati Library, Holy Name retreats & deep japa meditation.

---

### 1.2 Globally Unique Primary Key (`media_id`)
Row indexes and sequential numbers **MUST NEVER** be used as primary keys. All sadhana state (Heard, Starred, Playback progress) binds strictly to the immutable `id`:

- **YouTube**: `yt:<11-char-id>` (e.g. `yt:STfiWntZzHE`).
- **ISKCON Desire Tree**: `idt:<sha1-hash-of-path>` (e.g. `idt:a3b4c5d6e7f8`).
- **Saranagati Library**: `sar:<sha1-hash-of-filename>` (e.g. `sar:e9f8a7b6c5d4`).

---

### 1.3 Sources Registry & Deduplication Invariant
Before adding any new playlist or folder:
- All tools check existing IDs in `data/speakers/<speaker_slug>.json`.
- Previously ingested IDs are skipped in 0ms.
- Every onboarded URL or folder is logged into `data/sources_registry.json`.

---

## 2. Data Schema Contract

Each lecture object follows this structure:

```json
{
  "id": "yt:jkVJUugcElE",
  "yt_id": "jkVJUugcElE",
  "title": "1. Bhakti Sandharbha - Introduction",
  "speaker": "Balaram Shakti Das",
  "speaker_slug": "balaram-shakti-das",
  "category": "Bhakti Sandarbha",
  "subcategory": "",
  "source_type": "youtube",
  "url": "https://www.youtube.com/watch?v=jkVJUugcElE",
  "media_url": "https://www.youtube.com/watch?v=jkVJUugcElE",
  "channel": "Bhakti Grantha Sevā",
  "duration": "1:11:13",
  "upload_date": ""
}
```

For direct MP3 audio files (e.g., ISKCON Desire Tree or Saranagati Library):
- `source_type`: `"audio"`
- `media_url`: Direct streaming URL to the MP3 file (`https://.../lecture.mp3`).

---

## 3. Directory Layout

```
my-hearing/
├── app/
│   ├── globals.css              # Devotional theme tokens & styles
│   ├── layout.tsx               # Root layout & page metadata
│   └── page.tsx                 # High-performance server entry point
├── components/
│   ├── CatalogueClient.tsx      # Core state controller & interactive UI
│   ├── LectureCard.tsx          # Card with Heard, Star, Play actions
│   ├── Navbar.tsx               # Brand header, sadhana pills & theme toggle
│   ├── SadhanaStatsModal.tsx    # Sadhana metrics, breakdown & backup/restore
│   ├── SearchAndFilters.tsx     # Fast search, filter pills & category dropdown
│   ├── SpeakerSelector.tsx      # Alphabetical speaker badges & counts
│   └── UnifiedPlayer.tsx        # Bottom player for both YouTube & MP3 audio
├── data/
│   ├── catalog.json             # Complete master index of all lectures
│   ├── speakers_index.json      # Alphabetical speaker roster & stats
│   ├── sources_registry.json    # Record of all onboarded sources & timestamps
│   └── speakers/                # Partitioned speaker files
│       ├── amarendra-das.json
│       ├── balaram-shakti-das.json
│       ├── bhurijana-das.json
│       ├── hari-parshad-das.json
│       ├── indradyumna-swami.json
│       ├── madhavananda-das.json
│       ├── radha-govinda-das-goswami.json
│       ├── radhika-raman-das.json
│       └── sacinandana-swami.json
├── hooks/
│   └── useSadhana.ts            # Reactive localStorage sadhana tracking hook
├── public/
│   └── data/                    # Mirrored data files for static HTTP fetching
├── scripts/
│   ├── onboard_youtube.py       # Single-pass fast YouTube playlist/channel scraper
│   ├── onboard_all_youtube.py   # Batch onboarding for initial YouTube playlists
│   ├── onboard_idt.py           # ISKCON Desire Tree recursive MP3 indexer
│   ├── onboard_saranagati.py    # Saranagati Library audio scraper
│   ├── import_hpd.py            # Imports lectures from ../hpd-talks
│   ├── import_rrd.py            # Imports lectures from talks - RRD.csv
│   └── build_catalog.py         # Merges, sorts, and compiles catalog & indexes
├── AGENTS.md                    # This document
├── README.md                    # Project overview & user manual
├── package.json                 # Next.js 15, React 18, Tailwind CSS, Lucide
└── tsconfig.json                # Strict TypeScript configuration
```

---

## 4. Onboarding Workflows & Commands

### 4.1 Onboard a New YouTube Playlist or Channel
```bash
python3 scripts/onboard_youtube.py \
  --url "https://www.youtube.com/playlist?list=..." \
  --speaker "Amarendra Das" \
  --category "Bhagavad Gita Overview"
```
*Note*: If `--category` is omitted, the script automatically detects the playlist title on YouTube.

### 4.2 Rebuild Master Catalog
Whenever any speaker JSON is updated or added:
```bash
python3 scripts/build_catalog.py
```
This compiles `data/catalog.json`, `data/speakers_index.json`, and mirrors them to `public/data/`.

---

## 5. Deployment Guidelines

- **Platform**: Vercel.
- **Framework Preset**: Next.js.
- **Build Command**: `next build`.
- **Output Directory**: `.next` (default).
- **Environment**: Node.js 18.x, 20.x, or 22.x+.
