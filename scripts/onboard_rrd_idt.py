#!/usr/bin/env python3
"""
Onboards audio lectures from audio.iskcondesiretree.com for HG Radhika Raman Das:
URL: https://audio.iskcondesiretree.com/index.php?q=f&f=%2F03_-_ISKCON_Prabhujis%2FISKCON_Prabhujis_-_K_to_R%2FHis_Grace_Radhika_Raman_Prabhu%2FLectures

Performs strict deduplication against existing YouTube video lectures:
- Skips duplicate recordings already present from YouTube (In Defense of Lord Rama, Lord Caitanya & World Religions, Tattva Sandarbha, Sanskrit for Scriptural Study Parts 1 & 3, SB 8.8.21 Vrindavan).
- Ingests 64 new, non-duplicate audio discourses with clean categories, subcategories, and deterministic idt:<hash> IDs.
"""

import datetime
import hashlib
import json
import os
import re
import urllib.parse
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
REGISTRY_FILE = os.path.join(DATA_DIR, "sources_registry.json")

BASE_HOST = "https://audio.iskcondesiretree.com"
ROOT_FOLDER = "/03_-_ISKCON_Prabhujis/ISKCON_Prabhujis_-_K_to_R/His_Grace_Radhika_Raman_Prabhu/Lectures"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

# Exact duplicates already present on YouTube in the catalogue
KNOWN_SKIPS = {
    "Radhika Raman_Pr_Seminars_-_In_Defense_of_Lord_Rama_01_-_2015-05-16_ISKCON_New_Jersey.mp3",
    "Radhika Raman_Pr_Seminars_-_In_Defense_of_Lord_Rama_02_-_2015-05-17_ISKCON_New_Jersey.mp3",
    "Radhika Raman_Pr_Seminars_-_In_Defense_of_Lord_Rama_03_-_2015-05-17_ISKCON_New_Jersey.mp3",
    "01_-_RRP_Seminars_-_Importance_of_understanding_Other_Religons.mp3",
    "02_-_RRP_Seminars_-_Introduction_to_Prominent_World_Religons.mp3",
    "03_-_RRP_Seminars_-_Lord_Caitanya_and_the_Chand_Kazi.mp3",
    "04_-_RRP_Seminars_-_Unique_Aspects_of_Lord_Caitanya_and_the_Sankirtan_Movement.mp3",
    "RRP_Seminars_-_Tattva_Sandarbha_Part-01_-_2014-09-06_Silicon_Valley.mp3",
    "RRP_Seminars_-_Tattva_Sandarbha_Part-02_-_2014-09-06_Silicon_Valley.mp3",
    "RRP_Seminars_-_Tattva_Sandarbha_Part-03_-_2014-09-07_Silicon_Valley.mp3",
    "RRP_Seminars_-_Sanskrit_for_Scriptural_Study_Part-01_-_2017-09-02_ISKCON_Silicon_Valley.mp3",
    "RRP_Seminars_-_Sanskrit_for_Scriptural_Study_Part-03_-_2017-09-03_ISKCON_Silicon_Valley.mp3",
    "Radhika_Raman_Pr_SB_08-08-21_-_2018-12-21_ISKCON_Vrindavan.mp3",
}


def clean_lecture_info(filename: str, folder: str):
    """Generates clean title, category, subcategory, and upload_date."""
    # Extract date if present
    date_match = re.search(r"(\d{4}[-_.]\d{2}[-_.]\d{2})", filename)
    upload_date = date_match.group(1).replace("_", "-").replace(".", "-") if date_match else ""

    category = "Various Discourses"
    subcategory = ""
    title = filename

    if "Bhagavad_Gita" in folder:
        category = "Bhagavad Gita"
        m = re.search(r"BG[_\s]+(\d+)[-_](\d+)(?:[-_](\d+))?", filename)
        if m:
            ch = m.group(1)
            v1 = m.group(2)
            v2 = m.group(3)
            verse_str = f"BG {ch}.{v1}" + (f"-{v2}" if v2 else "")
            loc = "Boise Temple" if "Boise" in filename else ""
            title = f"{verse_str}" + (f" - {loc}" if loc else "") + (f" ({upload_date})" if upload_date else "")
            subcategory = f"Chapter {int(ch)}"
    elif "Chaitanya_Charitamrita" in folder:
        category = "Caitanya Caritāmṛta"
        subcategory = "Madhya Lila"
        title = f"CC Madhya Lila 16.281 - ISKCON Radhadesh ({upload_date})"
    elif "Nectar_of_Instruction" in folder:
        category = "Upadeśāmṛta (Nectar of Instruction)"
        m = re.search(r"Ch[-_](\d+)", filename)
        verse_num = int(m.group(1)) if m else ""
        subcategory = f"Verse {verse_num}" if verse_num else "Verses"
        title = f"Nectar of Instruction - Verse {verse_num} - Boise Temple ({upload_date})"
    elif "Srimad_Bhagavatam" in folder:
        category = "Srimad Bhagavatam"
        m = re.search(r"SB[_\s]+(\d+)[-_](\d+)[-_](\d+)(?:[-_](\d+))?", filename)
        if m:
            canto = int(m.group(1))
            ch = int(m.group(2))
            v1 = m.group(3)
            v2 = m.group(4)
            verse_str = f"SB {canto}.{ch}.{v1}" + (f"-{v2}" if v2 else "")
            subcategory = f"Canto {canto}"
            extra = ""
            if "Knowing_Krishna_As_He_Is" in filename:
                extra = " - Knowing Krishna As He Is - ISKCON Chowpatty"
            elif "Strength_Of_Being_Packed" in filename:
                extra = " - Strength of Being Packed in Association - ISKCON Chowpatty"
            elif "Dialectical_spiritualism" in filename:
                extra = " - Dialectical Spiritualism - ISKCON Melbourne"
            elif "Radhadesh" in filename:
                extra = " - ISKCON Radhadesh"
            elif "Chicago" in filename:
                extra = " - ISKCON Chicago"
            elif "Los_Angeles" in filename:
                extra = " - Los Angeles"
            title = f"{verse_str}{extra}" + (f" ({upload_date})" if upload_date else "")
    elif "Seminar" in folder:
        if "Essence_of_Bhagavad_Gita" in folder and "Towaco" not in filename:
            category = "Essence of Bhagavad Gita"
            m = re.search(r"Day[-_](\d+)(?:[-_](\d+))?", filename)
            day = m.group(1) if m else ""
            pt = m.group(2) if m and m.group(2) else ""
            subcategory = f"Day {day}"
            title = f"Essence of Bhagavad Gita - Day {day}" + (f" (Part {pt})" if pt else "")
        elif "The_Essence_of_Bhagavad_Gita" in folder or "Towaco" in filename:
            category = "The Essence of Bhagavad Gita (Towaco)"
            subcategory = "Towaco Seminar"
            m = re.search(r"(\d+)[-_].*The_Essence_of_Bhagavad_Gita(?:\(([ab])\))?", filename, re.IGNORECASE)
            if m:
                part_num = int(m.group(1))
                part_sub = m.group(2).upper() if m.group(2) else ""
                title = f"The Essence of Bhagavad Gita - Part {part_num}{part_sub} - ISKCON Towaco"
            else:
                title = os.path.splitext(filename)[0].replace("_", " ")
        elif "Essence_of_all_Advice" in folder:
            category = "Essence of All Advice"
            subcategory = "Washington DC Seminar"
            m = re.search(r"(\d+)", filename)
            num = int(m.group(1)) if m else ""
            title = f"Essence of All Advice - Part {num} - Washington DC"
        elif "Sanskrit_for_Scriptural_Study" in folder:
            category = "Sanskrit for Scriptural Study"
            subcategory = "Part 2"
            pt = "2A" if "02_01" in filename else "2B"
            title = f"Sanskrit for Scriptural Study - Part {pt} - ISKCON Silicon Valley (2017-09-02)"
        elif "The_Glories_of_the_Srimad_Bhagavatam" in folder:
            category = "Glories of Srimad Bhagavatam"
            subcategory = "Towaco 2010 Seminar"
            pt = "1" if "Part-01" in filename else "2"
            title = f"The Glories of the Srimad Bhagavatam - Part {pt} - Towaco (2010-11)"
    elif "Various" in folder:
        category = "Various Discourses"
        clean = filename.replace("Radhika_Raman_Pr_Various_-_", "").replace("RRP_Various_-_", "")
        clean = os.path.splitext(clean)[0].replace("_", " ")
        clean = clean.replace("hinding the right Balance", "finding the Right Balance")
        clean = clean.replace("Trailts", "Traits")
        title = clean
        if "Hanuman" in filename:
            subcategory = "Lord Hanuman"
        elif "Narsimhadeva" in filename:
            subcategory = "Appearance Days"
        elif "Parenting" in filename:
            subcategory = "Parenting"
        elif "Google" in filename:
            subcategory = "Engaged Vaishnavism"
        elif "Homeschooling" in filename:
            subcategory = "Education & Life"
        elif "Leader" in filename:
            subcategory = "Leadership"
        elif "Shiva" in filename:
            subcategory = "Lord Shiva"
        elif "Balance" in filename or "Hands" in filename:
            subcategory = "Mind & Devotion"
        else:
            subcategory = "Spiritual Life"

    return title, category, subcategory, upload_date


def run_onboarding():
    speaker_slug = "radhika-raman-das"
    speaker_name = "Radhika Raman Das"
    speaker_file = os.path.join(SPEAKERS_DIR, f"{speaker_slug}.json")

    # Load existing speaker file
    existing_items = []
    seen_ids = set()
    if os.path.exists(speaker_file):
        with open(speaker_file, "r", encoding="utf-8") as f:
            existing_items = json.load(f)
            for item in existing_items:
                seen_ids.add(item["id"])

    print(f"[{speaker_name}] Loaded {len(existing_items)} existing lectures.")

    # Check if raw cache exists in /tmp/rrd_idt_unique.json
    cache_file = "/tmp/rrd_idt_unique.json"
    unique_files = []
    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as f:
            unique_files = json.load(f)
        print(f"Loaded {len(unique_files)} unique IDT files from cache.")
    else:
        # Fallback to direct crawl if cache not found
        queue = [ROOT_FOLDER]
        visited = set()
        while queue:
            curr = queue.pop(0)
            if curr in visited:
                continue
            visited.add(curr)
            url = f"{BASE_HOST}/index.php?q=f&f={urllib.parse.quote(curr)}"
            req = urllib.request.Request(url, headers=HEADERS)
            html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
            for m1, m2 in re.findall(r"href=[\'\"]?index\.php\?q=f&amp;f=([^&\'\"\s>]+)|href=[\'\"]?index\.php\?q=f&f=([^&\'\"\s>]+)", html, re.I):
                raw = urllib.parse.unquote(m1 or m2)
                if raw.startswith(ROOT_FOLDER) and raw != curr and raw not in visited:
                    queue.append(raw)
            for m in re.findall(r"href=[\'\"]?([^\'\"\s>]+\.mp3)[\'\"]?", html, re.I):
                clean_mp3 = urllib.parse.unquote(m)
                if not clean_mp3.startswith("http"):
                    clean_mp3 = BASE_HOST + (clean_mp3 if clean_mp3.startswith("/") else "/" + clean_mp3)
                fn = clean_mp3.split("/")[-1]
                if not any(f["url"] == clean_mp3 for f in unique_files):
                    unique_files.append({"folder": curr, "url": clean_mp3, "filename": fn})

    added_items = []
    skipped_duplicates = []

    for item in unique_files:
        filename = item["filename"]
        folder = item["folder"]
        media_url = item["url"]

        if filename in KNOWN_SKIPS:
            skipped_duplicates.append(filename)
            continue

        # Generate deterministic idt ID based on URL path
        path = urllib.parse.urlparse(media_url).path
        path_hash = hashlib.sha1(path.encode("utf-8")).hexdigest()[:12]
        media_id = f"idt:{path_hash}"

        if media_id in seen_ids:
            continue
        seen_ids.add(media_id)

        title, category, subcategory, upload_date = clean_lecture_info(filename, folder)

        added_items.append({
            "id": media_id,
            "title": title,
            "speaker": speaker_name,
            "speaker_slug": speaker_slug,
            "category": category,
            "subcategory": subcategory,
            "source_type": "audio",
            "url": media_url,
            "media_url": media_url,
            "channel": "ISKCON Desire Tree",
            "duration": "",
            "upload_date": upload_date,
        })

    print(f"\n✅ Deduplication Summary:")
    print(f"   Skipped {len(skipped_duplicates)} exact duplicates already present on YouTube:")
    for skip in sorted(skipped_duplicates):
        print(f"     - {skip}")
    print(f"   Adding {len(added_items)} new authentic audio lectures.")

    total_items = existing_items + added_items
    with open(speaker_file, "w", encoding="utf-8") as f:
        json.dump(total_items, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(total_items)} lectures into {speaker_file}.")

    # Update sources_registry.json
    registry_data = {"sources": []}
    if os.path.exists(REGISTRY_FILE):
        with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
            loaded = json.load(f)
            if isinstance(loaded, dict) and "sources" in loaded:
                registry_data = loaded
            elif isinstance(loaded, list):
                registry_data = {"sources": loaded}

    registry_data["sources"].append({
        "url": f"{BASE_HOST}/index.php?q=f&f={urllib.parse.quote(ROOT_FOLDER)}",
        "type": "idt_audio",
        "speaker": speaker_name,
        "speaker_slug": speaker_slug,
        "category": "Various IDT Lectures",
        "added_count": len(added_items),
        "total_speaker_count": len(total_items),
        "timestamp": datetime.datetime.now().isoformat(),
    })

    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry_data, f, indent=2, ensure_ascii=False)
    print(f"Updated {REGISTRY_FILE}.")


if __name__ == "__main__":
    run_onboarding()
