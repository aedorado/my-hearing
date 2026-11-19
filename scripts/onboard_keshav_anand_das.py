#!/usr/bin/env python3
"""
Onboards all 1,590 discourses from Dr. Keshav Anand Das (@keshvananddas)
Categorizes strictly into:
- Bhagavad Gita (Chapters 01 to 18)
- Srimad Bhagavatam (Cantos 01 to 12)
- Caitanya Caritāmṛta (Adi, Madhya, Antya Lila)
- Bhakti-rasāmṛta-sindhu, Bṛhad-bhāgavatāmṛta, Priti Sandarbha
- Upadeśāmṛta, Śrī Īśopaniṣad, Śikṣāṣṭakam, Stutis
- Vaishnava Acaryas, Festivals, Sadhana & Philosophy
"""

import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")
REGISTRY_FILE = os.path.join(DATA_DIR, "sources_registry.json")

RAW_VIDEOS_FILE = "/tmp/keshav_anand_das_raw.json"
MAPPING_FILE = "/tmp/keshav_video_to_playlist.json"
TARGET_FILE = os.path.join(SPEAKERS_DIR, "keshav-anand-das.json")

SPEAKER_NAME = "Keshav Anand Das"
SPEAKER_SLUG = "keshav-anand-das"


def format_duration(seconds):
    if not seconds or seconds <= 0:
        return ""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def classify_item(item, video_to_pl):
    vid = item.get("id")
    raw_title = item.get("title", "").strip()
    playlists = video_to_pl.get(vid, [])
    pl_str = " | ".join(playlists)

    category = "Thematic Seminars & Upadesha"
    subcategory = "Discourses"

    # 1. Check Bhagavad Gita
    bg_pl = [p for p in playlists if "भगवद्गीता" in p or "अध्याय" in p]
    if bg_pl:
        category = "Bhagavad Gita"
        for p in bg_pl:
            m = re.search(r"अध्याय\s*(\d+)", p)
            if m:
                subcategory = f"Chapter {int(m.group(1)):02d}"
                break
        else:
            subcategory = "General Verses"
    elif re.search(r"\bBG[_\s]*(\d+)", raw_title, re.I) or "भगवद्गीता" in raw_title:
        category = "Bhagavad Gita"
        m = re.search(r"\bBG[_\s]*(\d+)", raw_title, re.I)
        m2 = re.search(r"अध्याय\s*(\d+)", raw_title)
        if m:
            subcategory = f"Chapter {int(m.group(1)):02d}"
        elif m2:
            subcategory = f"Chapter {int(m2.group(1)):02d}"
        else:
            subcategory = "General Verses"

    # 2. Check Srimad Bhagavatam
    elif any("SB स्कंध" in p or "भागवत" in p for p in playlists):
        category = "Srimad Bhagavatam"
        for p in playlists:
            m = re.search(r"स्कंध\s*(\d+)", p)
            if m:
                subcategory = f"Canto {int(m.group(1)):02d}"
                break
        else:
            m = re.search(r"\bSB[_\s]*(\d+)", raw_title, re.I)
            if m:
                subcategory = f"Canto {int(m.group(1)):02d}"
            else:
                subcategory = "Special Katha & Mahatmya"
    elif re.search(r"\bSB[_\s]*(\d+)", raw_title, re.I) or "श्रीमद् भागवत" in raw_title or "भागवतम" in raw_title:
        category = "Srimad Bhagavatam"
        m = re.search(r"\bSB[_\s]*(\d+)", raw_title, re.I)
        m2 = re.search(r"स्कंध\s*(\d+)", raw_title)
        if m:
            subcategory = f"Canto {int(m.group(1)):02d}"
        elif m2:
            subcategory = f"Canto {int(m2.group(1)):02d}"
        else:
            subcategory = "Special Katha & Mahatmya"

    # 3. Caitanya Caritamrita
    elif any("CC " in p or "चैतन्य" in p for p in playlists) or "CC " in raw_title or "चैतन्य" in raw_title:
        category = "Caitanya Caritāmṛta"
        if any("आदि" in p for p in playlists) or "आदि" in raw_title:
            subcategory = "Adi Lila"
        elif any("मध्य" in p for p in playlists) or "मध्य" in raw_title:
            subcategory = "Madhya Lila"
        elif any("अंत्य" in p for p in playlists) or "अंत्य" in raw_title:
            subcategory = "Antya Lila"
        else:
            subcategory = "Pancha Tattva & Gaura Lila"

    # 4. Specific Grantha
    elif any("भक्ति रसामृत" in p for p in playlists) or "भक्ति रसामृत" in raw_title or "BRS" in raw_title:
        category = "Bhakti-rasāmṛta-sindhu"
        subcategory = "Bhakti-rasāmṛta-sindhu"
    elif any("बृहत् भागवतामृत" in p for p in playlists) or "बृहत् भागवतामृत" in raw_title:
        category = "Bṛhad-bhāgavatāmṛta"
        subcategory = "Bṛhad-bhāgavatāmṛta"
    elif any("प्रीति सन्दर्भ" in p for p in playlists) or "प्रीति सन्दर्भ" in raw_title:
        category = "Priti Sandarbha"
        subcategory = "Priti Sandarbha"
    elif any("उपदेशामृत" in p for p in playlists) or "उपदेशामृत" in raw_title:
        category = "Upadeśāmṛta (Nectar of Instruction)"
        subcategory = "Upadeśāmṛta"
    elif any("ईशोपनिषद" in p or "उपनिषद्" in p for p in playlists) or "ईशोपनिषद" in raw_title:
        category = "Śrī Īśopaniṣad & Upanisads"
        subcategory = "Īśopaniṣad & Upanisads"
    elif any("शिक्षाष्टकम" in p for p in playlists) or "शिक्षाष्टकम" in raw_title:
        category = "Śikṣāṣṭakam"
        subcategory = "Śikṣāṣṭakam"
    elif any("विलाप कुसुमांजलि" in p for p in playlists) or "विलाप कुसुमांजलि" in raw_title:
        category = "Vilāpa Kusumāñjali"
        subcategory = "Vilāpa Kusumāñjali"
    elif any("कृष्ण कर्णामृत" in p for p in playlists) or "कृष्ण कर्णामृत" in raw_title:
        category = "Kṛṣṇa Karṇāmṛta"
        subcategory = "Kṛṣṇa Karṇāmṛta"
    elif any("विष्णु सहस्रनाम" in p for p in playlists) or "विष्णु सहस्रनाम" in raw_title:
        category = "Viṣṇu Sahasranāma"
        subcategory = "Viṣṇu Sahasranāma"
    elif any("वृंदावन महिमामृत" in p for p in playlists) or "वृंदावन महिमामृत" in raw_title:
        category = "Vrindavan Mahimamrita"
        subcategory = "Vrindavan Mahimamrita"
    elif any("राम कथा" in p for p in playlists) or "राम कथा" in raw_title or "रामायण" in raw_title:
        category = "Sri Ramayana & Lord Rama Katha"
        subcategory = "Ram Katha"

    # 5. Krishna Lila & Stutis
    elif any(k in pl_str or k in raw_title for k in ["गोपी गीत", "वेणु गीत", "कृष्ण दर्शन", "दर्शन"]):
        category = "Krishna Lila & Stutis"
        if "गोपी गीत" in pl_str or "गोपी गीत" in raw_title:
            subcategory = "Gopi Gita"
        elif "वेणु गीत" in pl_str or "वेणु गीत" in raw_title:
            subcategory = "Venu Gita"
        else:
            subcategory = "Lila Katha"

    # 6. Acaryas & Prabhupada
    elif any("प्रभुपाद" in p for p in playlists) or "प्रभुपाद" in raw_title:
        category = "Srila Prabhupada & Acaryas"
        subcategory = "Srila Prabhupada"
    elif any(k in pl_str or k in raw_title for k in ["रूप गोस्वामी", "विश्वनाथ चक्रवर्ती", "भक्तिविनोद", "भक्तिसिद्धांत", "रामानुजाचार्य", "षड्गोस्वामी", "आचार्य", "सम्प्रदाय"]):
        category = "Srila Prabhupada & Acaryas"
        subcategory = "Vaishnava Acaryas"

    # 7. Festivals & Dham
    elif any(k in pl_str or k in raw_title for k in ["जन्माष्टमी", "गौर पूर्णिमा", "गोवर्धन", "नृसिहं", "नृसिंह", "बलराम", "उत्सव"]):
        category = "Vaishnava Festivals & Dhama"
        subcategory = "Festivals & Utsavs"
    elif any(k in pl_str or k in raw_title for k in ["धाम", "तीर्थ", "वृंदावन"]):
        category = "Vaishnava Festivals & Dhama"
        subcategory = "Holy Dham"

    # 8. Sadhana & Philosophy
    elif any(k in pl_str or k in raw_title for k in ["नाम जप", "जप", "स्मरण", "आरती", "भजन", "अष्टकम"]):
        category = "Sadhana & Spiritual Practice"
        if "जप" in pl_str or "जप" in raw_title or "स्मरण" in pl_str:
            subcategory = "Japa & Holy Name"
        else:
            subcategory = "Kirtan & Bhajans"
    elif any(k in pl_str or k in raw_title for k in ["मायावाद", "माया", "दैवी गुण", "कृष्ण प्रेम", "केवल Bhakti", "ब्रह्मचारी या गृहस्थ", "गुरु शिष्य"]):
        category = "Gaudiya Vaishnava Philosophy"
        subcategory = "Philosophy & Practice"
    elif any(k in pl_str or k in raw_title for k in ["प्रश्न-उत्तर", "सवालों के जवाब"]):
        category = "Thematic Seminars & Upadesha"
        subcategory = "Q&A"
    elif "Bhopal" in pl_str or "Seminar" in pl_str:
        category = "Thematic Seminars & Upadesha"
        subcategory = "Seminars"
    else:
        category = "Thematic Seminars & Upadesha"
        subcategory = "Discourses"

    # Clean title: strip trailing '|| Dr. Keshav Anand Das'
    clean_t = re.sub(r"\s*\|\|\s*Dr\.?\s*Keshav\s*Anand\s*Das\s*$", "", raw_title, flags=re.I).strip()
    return category, subcategory, clean_t


def main():
    if not os.path.exists(RAW_VIDEOS_FILE):
        print(f"File not found: {RAW_VIDEOS_FILE}")
        return

    with open(RAW_VIDEOS_FILE) as f:
        raw_videos = json.load(f)

    video_to_pl = {}
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE) as f:
            video_to_pl = json.load(f)

    print(f"Processing {len(raw_videos)} lectures for {SPEAKER_NAME}...")

    lectures = []
    seen_ids = set()

    for item in raw_videos:
        yt_id = item.get("id")
        if not yt_id or yt_id in seen_ids:
            continue
        seen_ids.add(yt_id)

        category, subcategory, title = classify_item(item, video_to_pl)
        duration_str = format_duration(item.get("duration"))
        upload_date = item.get("upload_date") or ""

        url = f"https://www.youtube.com/watch?v={yt_id}"

        lectures.append({
            "id": f"yt:{yt_id}",
            "yt_id": yt_id,
            "title": title,
            "speaker": SPEAKER_NAME,
            "speaker_slug": SPEAKER_SLUG,
            "category": category,
            "subcategory": subcategory,
            "source_type": "youtube",
            "url": url,
            "media_url": url,
            "channel": "Keshav Anand Das - HINDI",
            "duration": duration_str,
            "upload_date": upload_date,
        })

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        json.dump(lectures, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved {len(lectures)} lectures to {TARGET_FILE}.")

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
        "url": "https://www.youtube.com/@keshvananddas/videos",
        "type": "youtube_channel",
        "speaker": SPEAKER_NAME,
        "speaker_slug": SPEAKER_SLUG,
        "category": "Entire Channel Archive",
        "added_count": len(lectures),
        "total_speaker_count": len(lectures),
        "timestamp": "2026-11-19T17:35:00.000000+00:00",
    })

    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry_data, f, indent=2, ensure_ascii=False)
    print("Updated sources_registry.json.")


if __name__ == "__main__":
    main()
