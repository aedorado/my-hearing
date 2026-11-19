#!/usr/bin/env python3
"""
Scrapes audio lectures from saranagati-library.net for HH Sacinandana Swami.
Discovers available year directories, extracts MP3 files, cleans titles,
and outputs data/speakers/sacinandana-swami.json.
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
OUTPUT_FILE = os.path.join(SPEAKERS_DIR, "sacinandana-swami.json")

BASE_HOST = "https://www.saranagati-library.net"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def clean_title(filename: str) -> tuple[str, str, str]:
    # Typical: 2020.12.31_SSNS_Sanga-Mela--The-Bhakti-Tonic3--Krishna-meets-His-devotees_GB_EN.mp3
    name = os.path.splitext(filename)[0]
    
    # Try date extraction: YYYY.MM.DD
    date_match = re.match(r"^(\d{4}\.\d{2}\.\d{2})", name)
    upload_date = date_match.group(1).replace(".", "-") if date_match else ""

    # Remove date, speaker code SSNS, language suffixes like _GB_EN, _DE, _RU, etc.
    cleaned = re.sub(r"^\d{4}[\.\-_]\d{2}[\.\-_]\d{2}[\-_]*", "", name)
    cleaned = re.sub(r"^SSNS[_\-]*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"_[A-Z]{2}_[A-Z]{2}$|_[A-Z]{2}$", "", cleaned)
    
    # Split topic/category if marked by double hyphens --
    parts = [p.replace("-", " ").strip() for p in cleaned.split("--") if p.strip()]
    if len(parts) >= 2:
        category = parts[0]
        title = " - ".join(parts[1:])
    elif len(parts) == 1:
        title = parts[0]
        category = "General Lectures"
    else:
        title = name.replace("_", " ")
        category = "General Lectures"

    return title, category, upload_date


def fetch_url(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""


def main():
    os.makedirs(SPEAKERS_DIR, exist_ok=True)
    existing_items = []
    seen_ids = set()
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            existing_items = json.load(f)
            for item in existing_items:
                seen_ids.add(item["id"])

    print("Fetching Saranagati Library homepage...")
    home_html = fetch_url(BASE_HOST)
    if not home_html:
        print("Failed to reach saranagati-library.net")
        return

    # Find year paths: href="/1990/" etc.
    year_links = re.findall(r'href=[\'\"]?(/(\d{4})/)[\'\"]?', home_html)
    unique_years = sorted(list(set(y[0] for y in year_links)))
    print(f"Discovered {len(unique_years)} year archives on Saranagati Library: {unique_years[:5]} ... {unique_years[-3:]}")

    added_items = []

    for year_path in unique_years:
        year_url = f"{BASE_HOST}{year_path}"
        year_html = fetch_url(year_url)
        if not year_html:
            continue

        # Find MP3 file links: href="...mp3"
        mp3_matches = re.findall(r'href=[\'\"]?([^\"\'\s>]+\.mp3)[\'\"]?', year_html, re.IGNORECASE)
        year_added = 0
        for raw_mp3 in mp3_matches:
            filename = os.path.basename(raw_mp3)
            # URL join
            if raw_mp3.startswith("http"):
                media_url = raw_mp3
            elif raw_mp3.startswith("/"):
                media_url = f"{BASE_HOST}{raw_mp3}"
            else:
                media_url = f"{BASE_HOST}{year_path}{raw_mp3}"

            # Hash ID
            path_hash = hashlib.sha1(filename.encode("utf-8")).hexdigest()[:12]
            media_id = f"sar:{path_hash}"
            if media_id in seen_ids:
                continue
            seen_ids.add(media_id)

            title, _, upload_date = clean_title(filename)
            category = year_path.strip("/")

            added_items.append({
                "id": media_id,
                "title": title,
                "speaker": "Sacinandana Swami",
                "speaker_slug": "sacinandana-swami",
                "category": category,
                "subcategory": year_path.strip("/"),
                "source_type": "audio",
                "url": media_url,
                "media_url": media_url,
                "channel": "Saranagati Library",
                "duration": "",
                "upload_date": upload_date,
            })
            year_added += 1

        print(f"  {year_path}: Found {len(mp3_matches)} mp3s (+{year_added} new)")

    total_items = existing_items + added_items
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(total_items, f, indent=2, ensure_ascii=False)

    print(f"\n✅ [Sacinandana Swami] Added {len(added_items)} lectures. Total: {len(total_items)}")


if __name__ == "__main__":
    main()
