#!/usr/bin/env python3
"""
High-performance multithreaded YouTube upload_date backfill script for 'My Hearing'.
Directly extracts datePublished from YouTube HTML metadata with persistent caching.

Usage:
    python3 scripts/backfill_youtube_dates.py --speaker amarendra-das
    python3 scripts/backfill_youtube_dates.py --all
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
CACHE_FILE = os.path.join(DATA_DIR, ".yt_dates_cache.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(cache: dict):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def fetch_upload_date(yt_id: str) -> str:
    url = f"https://www.youtube.com/watch?v={yt_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            
            # Pattern 1: itemprop="datePublished" content="2026-11-18T08:48:25-08:00"
            m = re.search(r'itemprop=\"(?:datePublished|uploadDate)\"\s+content=\"([^\"]+)\"', html)
            if m:
                return m.group(1).split("T")[0]
            
            # Pattern 2: "publishDate":"2026-11-18..."
            m = re.search(r'\"publishDate\":\"([^\"]+)\"', html)
            if m:
                return m.group(1).split("T")[0]
                
            # Pattern 3: "uploadDate":"2026-11-18..."
            m = re.search(r'\"uploadDate\":\"([^\"]+)\"', html)
            if m:
                return m.group(1).split("T")[0]
    except Exception as e:
        # Fallback to simple regex or ignore
        pass
    return ""


def backfill_speaker(speaker_slug: str, cache: dict, max_workers: int = 12):
    speaker_file = os.path.join(SPEAKERS_DIR, f"{speaker_slug}.json")
    if not os.path.exists(speaker_file):
        print(f"File not found: {speaker_file}")
        return

    with open(speaker_file, "r", encoding="utf-8") as f:
        items = json.load(f)

    # Find YouTube items missing upload_date
    targets = []
    for item in items:
        if item.get("source_type") == "youtube":
            vid = item.get("yt_id") or (item["id"].replace("yt:", "") if item["id"].startswith("yt:") else "")
            if vid and not item.get("upload_date"):
                targets.append((item, vid))

    print(f"\n[{speaker_slug}] Found {len(targets)} YouTube lectures needing upload_date.")
    if not targets:
        return

    # Check cache first
    needed = []
    cached_count = 0
    for item, vid in targets:
        if vid in cache and cache[vid]:
            item["upload_date"] = cache[vid]
            cached_count += 1
        else:
            needed.append((item, vid))

    print(f"[{speaker_slug}] Restored {cached_count} from cache. Fetching {len(needed)} online with {max_workers} workers...")

    if not needed:
        with open(speaker_file, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        return

    fetched_count = 0
    failed_count = 0
    start_time = time.time()

    def worker_task(pair):
        item_ref, vid_ref = pair
        d = fetch_upload_date(vid_ref)
        return item_ref, vid_ref, d

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(worker_task, p): p for p in needed}
        for fut in as_completed(futures):
            item_ref, vid_ref, d = fut.result()
            if d:
                item_ref["upload_date"] = d
                cache[vid_ref] = d
                fetched_count += 1
            else:
                failed_count += 1

            total_done = fetched_count + failed_count
            if total_done % 20 == 0 or total_done == len(needed):
                elapsed = time.time() - start_time
                rate = total_done / elapsed if elapsed > 0 else 0
                print(f"  -> Progress: {total_done}/{len(needed)} done ({rate:.1f} vids/sec)...")
                save_cache(cache)

    # Save final speaker file
    with open(speaker_file, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    save_cache(cache)

    print(f"[{speaker_slug}] Finished! Successfully populated {fetched_count} dates ({failed_count} failed) in {time.time()-start_time:.1f}s.")


def main():
    parser = argparse.ArgumentParser(description="Backfill upload_date for YouTube lectures")
    parser.add_argument("--speaker", default="", help="Speaker slug (e.g. amarendra-das)")
    parser.add_argument("--all", action="store_true", help="Backfill all YouTube speakers")
    parser.add_argument("--workers", type=int, default=12, help="Number of concurrent workers (default: 12)")
    args = parser.parse_args()

    cache = load_cache()
    print(f"Loaded {len(cache)} cached dates.")

    if args.speaker:
        backfill_speaker(args.speaker, cache, args.workers)
    elif args.all:
        speakers = [
            "amarendra-das",
            "madhavananda-das",
            "indradyumna-swami",
            "balaram-shakti-das",
            "keshav-anand-das",
        ]
        for sp in speakers:
            backfill_speaker(sp, cache, args.workers)
    else:
        print("Please provide --speaker <slug> or --all")

    save_cache(cache)


if __name__ == "__main__":
    main()
