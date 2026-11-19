#!/usr/bin/env python3
"""
Imports HG Hari Parshad Das lectures from hpd-talks repository
into data/speakers/hari-parshad-das.json.
"""
import csv
import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
HPD_CSV = "/Users/anuragsharma/code/hpd-talks/data/combined_hpd_lectures.csv"
OUTPUT_FILE = os.path.join(REPO_ROOT, "data", "speakers", "hari-parshad-das.json")


def extract_yt_id(url: str) -> str:
    m = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return m.group(1) if m else ""


def main():
    if not os.path.exists(HPD_CSV):
        print(f"File not found: {HPD_CSV}")
        return

    items = []
    seen_ids = set()

    with open(HPD_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            speaker = row.get("Speaker", "").strip()
            # We want Hari Parshad Das
            if "Hari Parshad" not in speaker:
                continue

            url = row.get("URL", "").strip()
            yt_id = extract_yt_id(url)
            if not yt_id:
                continue
            media_id = f"yt:{yt_id}"
            if media_id in seen_ids:
                continue
            seen_ids.add(media_id)

            title = row.get("Title", "").strip()
            category = row.get("Category", "").strip() or "General"
            subcategory = row.get("Subcategory", "").strip()
            channel = row.get("Channel", "").strip()
            duration = row.get("Duration", "").strip()
            upload_date = row.get("Upload Date", "").strip()

            items.append({
                "id": media_id,
                "yt_id": yt_id,
                "title": title,
                "speaker": "Hari Parshad Das",
                "speaker_slug": "hari-parshad-das",
                "category": category,
                "subcategory": subcategory,
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

    print(f"Successfully imported {len(items)} lectures for Hari Parshad Das into {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
