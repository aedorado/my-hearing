#!/usr/bin/env python3
"""
Scrapes audio lectures from audio.iskcondesiretree.com for:
- HH Radha Govinda Das Goswami
- HG Bhurijana Das

Parses folders, extracts MP3 files, generates stable idt:<hash> IDs,
and saves partitioned JSON in data/speakers/.
"""
import datetime
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
REGISTRY_FILE = os.path.join(DATA_DIR, "sources_registry.json")

BASE_HOST = "https://audio.iskcondesiretree.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[-\s]+", "-", s)


def clean_title(filename: str) -> str:
    name = os.path.splitext(filename)[0]
    # Replace underscores and excessive spaces
    name = re.sub(r"[_\-]+", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def fetch_url(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""


def crawl_idt(root_path: str, speaker_name: str, max_depth: int = 3):
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

    queue = [(root_path, "", 0)]  # (folder_path, category_name, current_depth)
    visited_folders = set()
    added_items = []

    print(f"\n[{speaker_name}] Crawling IDT Root: {root_path}")

    while queue:
        folder_path, parent_cat, depth = queue.pop(0)
        if folder_path in visited_folders:
            continue
        visited_folders.add(folder_path)

        encoded_path = urllib.parse.quote(folder_path)
        folder_url = f"{BASE_HOST}/index.php?q=f&f={encoded_path}"
        html = fetch_url(folder_url)
        if not html:
            continue

        # Find subfolders: index.php?q=f&f=(...)
        subfolder_matches = re.findall(
            r'href=[\'\"]?index\.php\?q=f&amp;f=([^&\'\"\s>]+)|href=[\'\"]?index\.php\?q=f&f=([^&\'\"\s>]+)',
            html,
            re.IGNORECASE,
        )
        for m1, m2 in subfolder_matches:
            raw_sub = urllib.parse.unquote(m1 or m2)
            if raw_sub.startswith(folder_path) and raw_sub != folder_path and depth < max_depth:
                folder_name = os.path.basename(raw_sub.rstrip("/")).replace("_", " ")
                # Strip leading numeric prefix like '00 - ' or '01 - '
                folder_name = re.sub(r"^\d+[\s\-_]+", "", folder_name).strip()
                cat = f"{parent_cat} - {folder_name}" if parent_cat else folder_name
                if raw_sub not in visited_folders:
                    queue.append((raw_sub, cat, depth + 1))

        # Find MP3 files: href="(/...mp3)"
        mp3_matches = re.findall(r'href=[\'\"]?(/[^\"\'\s>]+\.mp3)[\'\"]?', html, re.IGNORECASE)
        for raw_mp3 in mp3_matches:
            mp3_path = urllib.parse.unquote(raw_mp3)
            filename = os.path.basename(mp3_path)
            media_url = f"{BASE_HOST}{urllib.parse.quote(mp3_path)}"
            
            # Deterministic ID based on normalized path
            path_hash = hashlib.sha1(mp3_path.encode("utf-8")).hexdigest()[:12]
            media_id = f"idt:{path_hash}"
            if media_id in seen_ids:
                continue
            seen_ids.add(media_id)

            title = clean_title(filename)
            category = parent_cat or os.path.basename(folder_path.rstrip("/")).replace("_", " ")
            category = re.sub(r"^\d+[\s\-_]+", "", category).strip() or "General"

            added_items.append({
                "id": media_id,
                "title": title,
                "speaker": speaker_name,
                "speaker_slug": speaker_slug,
                "category": category,
                "subcategory": "",
                "source_type": "audio",
                "url": media_url,
                "media_url": media_url,
                "channel": "ISKCON Desire Tree",
                "duration": "",
                "upload_date": "",
            })

        print(f"  Scanned: {os.path.basename(folder_path)} (Found {len(mp3_matches)} mp3s, queue size: {len(queue)})")

    total_items = existing_items + added_items
    with open(speaker_file, "w", encoding="utf-8") as f:
        json.dump(total_items, f, indent=2, ensure_ascii=False)

    print(f"✅ [{speaker_name}] Added {len(added_items)} lectures. Total: {len(total_items)}")


def main():
    targets = [
        {
            "speaker": "Radha Govinda Das Goswami",
            "root": "/02_-_ISKCON_Swamis/ISKCON_Swamis_-_R_to_Y/His_Holiness_Radha_Govinda_Swami",
        },
        {
            "speaker": "Bhurijana Das",
            "root": "/03_-_ISKCON_Prabhujis/ISKCON_Prabhujis_-_A_to_J/His_Grace_Bhurijana_Prabhu",
        },
    ]

    for t in targets:
        crawl_idt(t["root"], t["speaker"])


if __name__ == "__main__":
    main()
