#!/usr/bin/env python3
"""
Reprocesses data/speakers/sacinandana-swami.json to provide:
1. Pure Year-Wise Categorization (1985 to 2026).
2. Clean, Rich Subcategories (Kartik Katha, Holy Name & Japa Retreat, Saranagati Retreat, Srimad Bhagavatam, etc.).
3. Beautiful human-readable titles formatted with proper casing, spaced numbers, and timestamps.
"""

import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SNS_FILE = os.path.join(DATA_DIR, "speakers", "sacinandana-swami.json")


def clean_title(raw_text: str, date_str: str) -> str:
    # Handle multiple subtitles split by double-dash '--'
    sub_parts = raw_text.split("--")
    cleaned_parts = []

    for idx, p in enumerate(sub_parts):
        # Space out verse numbers like SB10.14.40 -> SB 10.14.40, BG16.4 -> BG 16.4
        p = re.sub(r"\b([A-Za-z]+)(\d+\.\d+)", r"\1 \2", p)
        p = re.sub(r"\bCc\.([A-Za-z]+)(\d+)", r"CC \1 \2", p)

        # Space out numbers attached to words like katha17 -> katha 17, Retreat3 -> Retreat 3
        p = re.sub(r"([a-zA-Z]+)(\d+)", r"\1 \2", p)

        # Replace hyphens and underscores with spaces
        p = p.replace("-", " ").replace("_", " ")

        # Clean common typos / formatting
        p = re.sub(r"\bPrabhupadas\b", "Prabhupada's", p, flags=re.I)
        p = re.sub(r"\bRadhas\b", "Radha's", p, flags=re.I)
        p = re.sub(r"\bNitais\b", "Nitai's", p, flags=re.I)
        p = re.sub(r"\bCaitanyas\b", "Caitanya's", p, flags=re.I)
        p = re.sub(r"\bKrishnas\b", "Krishna's", p, flags=re.I)

        # Capitalize nicely while keeping uppercase terms
        words = p.split()
        capitalized = [
            w if (w.isupper() or "." in w or "'" in w) else w.capitalize()
            for w in words
        ]
        cleaned_str = " ".join(capitalized).strip()
        if cleaned_str:
            cleaned_parts.append(cleaned_str)

    title = ": ".join(cleaned_parts) if cleaned_parts else raw_text

    # Strip redundant speaker prefix
    title = re.sub(r"^(?:SSNS|Sacinandana\s+Swami)\s*[-:]?\s*", "", title, flags=re.I).strip()

    # Append date if available and not already inside
    if date_str and f"({date_str})" not in title:
        title = f"{title} ({date_str})"

    return title


def classify_subcategory(raw_text: str) -> str:
    low = raw_text.lower()

    if "kartik" in low or "damodar" in low:
        return "Kartik Katha"
    elif "holy-name" in low or "holy_name" in low or "holy name" in low or "japa" in low:
        return "Holy Name & Japa Retreat"
    elif "saranagati" in low:
        return "Saranagati Retreat"
    elif "bhakti-immersion" in low or "bhakti_immersion" in low or "bhakti immersion" in low:
        return "Bhakti Immersion"
    elif "summer-camp" in low or "summer_camp" in low or "summer camp" in low:
        return "Summer Camps"
    elif "retreat" in low:
        return "Retreats & Seminars"
    elif "kirtan" in low or "mela" in low:
        return "Kirtan & Melas"
    elif low.startswith("sb") or " sb" in low or "srimad" in low or "bhagavatam" in low:
        return "Srimad Bhagavatam"
    elif low.startswith("bg") or " bg" in low or "bhagavad" in low or "gita" in low:
        return "Bhagavad Gita"
    elif low.startswith("cc") or " cc" in low or "caitanya" in low or "chaitanya" in low:
        return "Caitanya Caritāmṛta"
    elif "prabhupada" in low or "vyasa-puja" in low or "vyasapuja" in low:
        return "Srila Prabhupada & Vyasa Puja"
    elif any(f in low for f in ["gaura", "nityananda", "radhastami", "janmastami", "ramanavami", "rama", "nrsimha", "balarama", "festival"]):
        return "Vaishnava Festivals"
    elif "initiation" in low:
        return "Initiations & Vows"
    elif any(m in low for m in ["meeting", "interview", "sangha", "group"]):
        return "Sangha & Interviews"
    elif any(w in low for w in ["youth", "workshop", "online", "seminar", "podcast"]):
        return "Workshops & Seminars"
    elif "sunday" in low or "feast" in low:
        return "Sunday Feast Discourses"

    return "General Katha & Seminars"


def main():
    if not os.path.exists(SNS_FILE):
        print(f"File not found: {SNS_FILE}")
        return

    with open(SNS_FILE, "r", encoding="utf-8") as f:
        lectures = json.load(f)

    print(f"Reprocessing {len(lectures)} lectures for Sacinandana Swami...")

    processed = []
    for item in lectures:
        media_url = item.get("media_url", "")
        fn = media_url.split("/")[-1]
        base = os.path.splitext(fn)[0]

        # Extract date
        date_match = re.search(r"(\d{4})[\.\-_](\d{2})[\.\-_](\d{2})", base)
        year_str = item.get("category") or "General"
        date_str = ""
        if date_match:
            y, m, d = date_match.groups()
            year_str = y
            if d != "00":
                date_str = f"{y}-{m}-{d}"
            elif m != "00":
                date_str = f"{y}-{m}"
            else:
                date_str = y

        # Extract core content without date or location suffix
        parts = base.split("_SSNS_")
        raw_content = parts[1] if len(parts) > 1 else base
        raw_content = re.sub(r"^\d{4}[\.\-_]\d{2}[\.\-_]\d{2}[\.\-_]?", "", raw_content)
        raw_content = re.sub(r"^SSNS[_\-]?", "", raw_content)

        # Strip location & language codes
        cleaned_content = re.sub(r"_[A-Z]{1,4}_[A-Z]{2}$", "", raw_content)
        cleaned_content = re.sub(r"_[A-Z]{2}$", "", cleaned_content)

        title = clean_title(cleaned_content, date_str)
        subcategory = classify_subcategory(cleaned_content)

        processed.append({
            "id": item["id"],
            "title": title,
            "speaker": item["speaker"],
            "speaker_slug": item["speaker_slug"],
            "category": year_str,
            "subcategory": subcategory,
            "source_type": "audio",
            "url": item["url"],
            "media_url": item["media_url"],
            "channel": "Saranagati Library",
            "duration": item.get("duration", ""),
            "upload_date": date_str,
        })

    with open(SNS_FILE, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    print(f"✅ Successfully reprocessed {len(processed)} lectures into {SNS_FILE}")


if __name__ == "__main__":
    main()
