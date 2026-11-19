#!/usr/bin/env python3
"""
Imports HG Radhika Raman Das lectures from 'talks - RRD.csv'
into data/speakers/radhika-raman-das.json.
"""
import csv
import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
CSV_FILE = os.path.join(REPO_ROOT, "talks - RRD.csv")
OUTPUT_FILE = os.path.join(REPO_ROOT, "data", "speakers", "radhika-raman-das.json")


def extract_yt_id(url: str) -> str:
    m = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return m.group(1) if m else ""


def main():
    if not os.path.exists(CSV_FILE):
        print(f"File not found: {CSV_FILE}")
        return

    items = []
    seen_ids = set()

    with open(CSV_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            url = row.get("link", "").strip()
            yt_id = extract_yt_id(url)
            if not yt_id:
                continue
            media_id = f"yt:{yt_id}"
            if media_id in seen_ids:
                continue
            seen_ids.add(media_id)

            title = row.get("title", "").strip() or row.get("title_updated", "").strip()
            category = row.get("folder", "").strip() or "General"
            channel = row.get("Channel", "").strip()
            duration = row.get("duration", "").strip()
            upload_date = row.get("upload_date", "").strip()

            items.append({
                "id": media_id,
                "yt_id": yt_id,
                "title": title,
                "speaker": "Radhika Raman Das",
                "speaker_slug": "radhika-raman-das",
                "category": category,
                "subcategory": "",
                "source_type": "youtube",
                "url": f"https://www.youtube.com/watch?v={yt_id}",
                "media_url": f"https://www.youtube.com/watch?v={yt_id}",
                "channel": channel,
                "duration": duration,
                "upload_date": upload_date,
            })

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print(f"Successfully imported {len(items)} lectures for Radhika Raman Das into {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
