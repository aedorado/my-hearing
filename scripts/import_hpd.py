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
HPD_JSON = "/Users/anuragsharma/code/hpd-talks/data/lectures.json"
HPD_CSV = "/Users/anuragsharma/code/hpd-talks/data/combined_hpd_lectures.csv"
OUTPUT_FILE = os.path.join(REPO_ROOT, "data", "speakers", "hari-parshad-das.json")


def extract_yt_id(url: str) -> str:
    m = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return m.group(1) if m else ""


def import_from_json(json_path: str):
    with open(json_path, "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    items = []
    seen_ids = set()

    for row in raw_items:
        yt_id = row.get("yt_id") or extract_yt_id(row.get("url", ""))
        if not yt_id:
            continue
        media_id = f"yt:{yt_id}"
        if media_id in seen_ids:
            continue
        seen_ids.add(media_id)

        title = row.get("title", "").strip()
        category = row.get("category", "").strip() or "General"
        subcategory = row.get("subcategory", "").strip()
        channel = row.get("channel", "").strip() or "Hari Parshad Das"
        duration = row.get("duration", "").strip()
        upload_date = row.get("upload_date", "").strip()

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

    return items


def import_from_csv(csv_path: str):
    items = []
    seen_ids = set()

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
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
            channel = row.get("Channel", "").strip() or "Hari Parshad Das"
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

    return items


def main():
    if os.path.exists(HPD_JSON):
        print(f"Reading from JSON: {HPD_JSON}")
        items = import_from_json(HPD_JSON)
    elif os.path.exists(HPD_CSV):
        print(f"Reading from CSV: {HPD_CSV}")
        items = import_from_csv(HPD_CSV)
    else:
        print(f"Neither {HPD_JSON} nor {HPD_CSV} found.")
        return

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully imported {len(items)} lectures for Hari Parshad Das into {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
