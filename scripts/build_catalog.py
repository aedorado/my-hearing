#!/usr/bin/env python3
"""
Compiles, validates, and indexes all speaker datasets into:
- data/catalog.json (Complete searchable database)
- data/speakers_index.json (Alphabetical speaker roster & stats)
- data/catalog-data.js (Offline / static fallback)
"""
import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
PUBLIC_DATA_DIR = os.path.join(REPO_ROOT, "public", "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
PUBLIC_SPEAKERS_DIR = os.path.join(PUBLIC_DATA_DIR, "speakers")
CATALOG_JSON = os.path.join(DATA_DIR, "catalog.json")
SPEAKERS_INDEX_JSON = os.path.join(DATA_DIR, "speakers_index.json")

# The canonical speakers in strict alphabetical order
EXPECTED_SPEAKERS = [
    {"name": "Amarendra Das", "slug": "amarendra-das", "description": "Inspiring Bhagavad Gita & Srimad Bhagavatam discourses"},
    {"name": "Balaram Shakti Das", "slug": "balaram-shakti-das", "description": "In-depth Sandarbha and Gaudiya Vaishnava philosophy"},
    {"name": "Bhurijana Das", "slug": "bhurijana-das", "description": "Classic ISKCON teacher, author, and Bhagavat Subodhini seminars"},
    {"name": "Hari Parshad Das", "slug": "hari-parshad-das", "description": "Scholarly Vaishnava katha, Upadeshamrita & Caitanya Caritamrta"},
    {"name": "Indradyumna Swami", "slug": "indradyumna-swami", "description": "Vrindavan Parikrama, Polish Tour, kirtans and nectar discourses"},
    {"name": "Keshav Anand Das", "slug": "keshav-anand-das", "description": "Inspiring Hindi discourses on Bhagavad Gita, Srimad Bhagavatam & Gaudiya philosophy"},
    {"name": "Madhavananda Das", "slug": "madhavananda-das", "description": "Gopal Jiu Publications, Sri Jagannath & Gour Govinda Swami katha"},
    {"name": "Radha Govinda Das Goswami", "slug": "radha-govinda-das-goswami", "description": "Soul-stirring Srimad Bhagavatam Saptah & Krishna lila katha"},
    {"name": "Radhika Raman Das", "slug": "radhika-raman-das", "description": "Bhagavata Podcast, Gita insights, and academic Vaishnavism"},
    {"name": "Sacinandana Swami", "slug": "sacinandana-swami", "description": "Saranagati Library, Holy Name retreats & deep japa meditation"},
]


def main():
    os.makedirs(SPEAKERS_DIR, exist_ok=True)
    all_lectures = []
    seen_ids = set()
    speaker_stats = []

    for sp in EXPECTED_SPEAKERS:
        slug = sp["slug"]
        sp_file = os.path.join(SPEAKERS_DIR, f"{slug}.json")
        items = []
        if os.path.exists(sp_file):
            try:
                with open(sp_file, "r", encoding="utf-8") as f:
                    items = json.load(f)
            except Exception as e:
                print(f"Error reading {sp_file}: {e}")
        else:
            # Create empty placeholder if not yet present (e.g. Amarendra Das awaiting URLs)
            with open(sp_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

        # Collect categories
        categories = {}
        sources = set()
        clean_speaker_items = []

        for item in items:
            media_id = item.get("id")
            if not media_id or media_id in seen_ids:
                continue
            seen_ids.add(media_id)

            cat = item.get("category", "General").strip() or "General"
            categories[cat] = categories.get(cat, 0) + 1
            sources.add(item.get("source_type", "youtube"))
            clean_speaker_items.append(item)
            all_lectures.append(item)

        speaker_stats.append({
            "name": sp["name"],
            "slug": slug,
            "description": sp["description"],
            "total_lectures": len(clean_speaker_items),
            "sources": sorted(list(sources)),
            "categories": [{"name": k, "count": v} for k, v in sorted(categories.items(), key=lambda x: x[0].lower())],
        })

    # Sort lectures: Speaker name -> Category -> Title
    all_lectures.sort(key=lambda x: (x.get("speaker", "").lower(), x.get("category", "").lower(), x.get("title", "").lower()))

    # Write catalog.json
    with open(CATALOG_JSON, "w", encoding="utf-8") as f:
        json.dump(all_lectures, f, indent=2, ensure_ascii=False)

    # Also mirror to public/data for static client fetching
    os.makedirs(PUBLIC_SPEAKERS_DIR, exist_ok=True)
    with open(os.path.join(PUBLIC_DATA_DIR, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(all_lectures, f, ensure_ascii=False)

    # Write speakers_index.json
    with open(SPEAKERS_INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(speaker_stats, f, indent=2, ensure_ascii=False)
    with open(os.path.join(PUBLIC_DATA_DIR, "speakers_index.json"), "w", encoding="utf-8") as f:
        json.dump(speaker_stats, f, indent=2, ensure_ascii=False)

    # Mirror individual speaker files
    for sp in EXPECTED_SPEAKERS:
        slug = sp["slug"]
        src = os.path.join(SPEAKERS_DIR, f"{slug}.json")
        dst = os.path.join(PUBLIC_SPEAKERS_DIR, f"{slug}.json")
        if os.path.exists(src):
            with open(src, "r", encoding="utf-8") as f_in, open(dst, "w", encoding="utf-8") as f_out:
                f_out.write(f_in.read())

    print("\n" + "=" * 60)
    print(f"🎉 MASTER CATALOG BUILT SUCCESSFULLY")
    print(f"Total Unique Lectures: {len(all_lectures)}")
    print("=" * 60)
    for sp in speaker_stats:
        print(f" • {sp['name'].ljust(30)} : {sp['total_lectures']:>5} lectures ({len(sp['categories'])} categories)")
    print("=" * 60)


if __name__ == "__main__":
    main()
