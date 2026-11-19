#!/usr/bin/env python3
"""
Fast, robust YouTube Onboarding Script for 'My Hearing'.
Uses yt-dlp flat-playlist mode for single-pass fast ingestion.
Deduplicates by 11-char YouTube ID and records sources in data/sources_registry.json.

Usage:
    python3 scripts/onboard_youtube.py \
        --url "https://www.youtube.com/playlist?list=..." \
        --speaker "Madhavananda Das" \
        [--category "Optional Category Name"]
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
REGISTRY_FILE = os.path.join(DATA_DIR, "sources_registry.json")


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[-\s]+", "-", s)


def extract_yt_id(url: str) -> str:
    m = re.search(r"(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})", url)
    return m.group(1) if m else ""


def load_registry() -> dict:
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"sources": [], "updated_at": ""}


def save_registry(registry: dict):
    registry["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)


def onboard_playlist(target_url: str, speaker_name: str, forced_category: str = ""):
    speaker_slug = slugify(speaker_name)
    speaker_file = os.path.join(SPEAKERS_DIR, f"{speaker_slug}.json")
    os.makedirs(SPEAKERS_DIR, exist_ok=True)

    existing_items = []
    seen_ids = set()
    if os.path.exists(speaker_file):
        with open(speaker_file, "r", encoding="utf-8") as f:
            existing_items = json.load(f)
            for item in existing_items:
                seen_ids.add(item["id"])

    print(f"\n[{speaker_name}] Fetching: {target_url}")
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--no-update",
        "--ignore-errors",
        target_url,
    ]

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    added_items = []
    playlist_title_detected = ""

    for line in proc.stdout:
        line = line.strip()
        if not line:
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue

        vid = item.get("id") or extract_yt_id(item.get("url", ""))
        title = (item.get("title") or "").strip()
        if not vid or not title or title in ["[Deleted video]", "[Private video]"]:
            continue

        if not playlist_title_detected and item.get("playlist_title"):
            playlist_title_detected = item.get("playlist_title", "").strip()

        media_id = f"yt:{vid}"
        if media_id in seen_ids:
            continue
        seen_ids.add(media_id)

        # Category resolution: forced > playlist_title > "General"
        cat = forced_category or playlist_title_detected or item.get("playlist", "") or "General"
        channel = item.get("channel") or item.get("uploader") or ""
        duration = item.get("duration_string") or ""
        if not duration and item.get("duration"):
            secs = int(item["duration"])
            m, s = divmod(secs, 60)
            h, m = divmod(m, 60)
            duration = f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"

        added_items.append({
            "id": media_id,
            "yt_id": vid,
            "title": title,
            "speaker": speaker_name,
            "speaker_slug": speaker_slug,
            "category": cat,
            "subcategory": "",
            "source_type": "youtube",
            "url": f"https://www.youtube.com/watch?v={vid}",
            "media_url": f"https://www.youtube.com/watch?v={vid}",
            "channel": channel,
            "duration": duration,
            "upload_date": "",
        })

    proc.wait()

    total_items = existing_items + added_items
    with open(speaker_file, "w", encoding="utf-8") as f:
        json.dump(total_items, f, indent=2, ensure_ascii=False)

    print(f" -> Added {len(added_items)} new lectures. Total for {speaker_name}: {len(total_items)}")

    # Update Registry
    registry = load_registry()
    registry["sources"].append({
        "url": target_url,
        "speaker": speaker_name,
        "speaker_slug": speaker_slug,
        "category": forced_category or playlist_title_detected or "General",
        "added_count": len(added_items),
        "total_speaker_count": len(total_items),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    })
    save_registry(registry)


def main():
    parser = argparse.ArgumentParser(description="Onboard YouTube Playlist or Channel")
    parser.add_argument("--url", required=True, help="YouTube Playlist or Channel URL")
    parser.add_argument("--speaker", required=True, help="Speaker display name")
    parser.add_argument("--category", default="", help="Optional category/series name override")
    args = parser.parse_args()

    onboard_playlist(args.url, args.speaker, args.category)


if __name__ == "__main__":
    main()
