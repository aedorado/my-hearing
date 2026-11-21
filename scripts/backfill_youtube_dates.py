#!/usr/bin/env python3
"""
Ultra-fast, robust YouTube upload_date backfill script for 'My Hearing'.
Uses YouTube's Innertube API endpoint directly for instant JSON metadata without scraping HTML.

Usage:
    python3 scripts/backfill_youtube_dates.py --speaker amarendra-das
    python3 scripts/backfill_youtube_dates.py --all
"""
import argparse
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
CACHE_FILE = os.path.join(DATA_DIR, ".yt_dates_cache.json")

INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
HEADERS = {
    "Content-Type": "application/json",
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


def fetch_upload_date(yt_id: str, retries: int = 2) -> str:
    payload = {
        "videoId": yt_id,
        "context": {
            "client": {
                "clientName": "WEB",
                "clientVersion": "2.20240313.01.00",
                "hl": "en",
                "gl": "US",
            }
        },
    }
    for attempt in range(retries):
        req = urllib.request.Request(
            INNERTUBE_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=HEADERS,
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                mf = data.get("microformat", {}).get("playerMicroformatRenderer", {})
                raw_date = mf.get("publishDate") or mf.get("uploadDate") or ""
                if raw_date:
                    return raw_date.split("T")[0]
        except Exception:
            if attempt < retries - 1:
                time.sleep(1.0)
    return ""


def backfill_speaker(speaker_slug: str, cache: dict, max_workers: int = 10):
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
            if total_done % 50 == 0 or total_done == len(needed):
                elapsed = time.time() - start_time
                rate = total_done / elapsed if elapsed > 0 else 0
                print(f"  -> Progress: {total_done}/{len(needed)} done ({rate:.1f} vids/sec)...")
                save_cache(cache)

    # Save speaker file
    with open(speaker_file, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    save_cache(cache)

    print(f"[{speaker_slug}] Finished! Populated {fetched_count} dates ({failed_count} failed) in {time.time()-start_time:.1f}s.")


def main():
    parser = argparse.ArgumentParser(description="Backfill upload_date for YouTube lectures")
    parser.add_argument("--speaker", default="", help="Speaker slug (e.g. amarendra-das)")
    parser.add_argument("--all", action="store_true", help="Backfill all YouTube speakers")
    parser.add_argument("--workers", type=int, default=10, help="Number of concurrent workers (default: 10)")
    args = parser.parse_args()

    cache = load_cache()
    print(f"Loaded {len(cache)} cached dates.")

    if args.speaker:
        backfill_speaker(args.speaker, cache, args.workers)
    elif args.all:
        speakers = [
            "amarendra-das",
            "indradyumna-swami",
            "madhavananda-das",
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
