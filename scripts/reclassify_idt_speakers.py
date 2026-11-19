#!/usr/bin/env python3
"""
Reclassifies IDT audio archives for:
- HG Bhurijana Das (1,882 lectures)
- HH Radha Govinda Das Goswami (1,842 lectures)

Maps top-level IDT folders to clean primary Categories (Series / Themes)
and nested subfolders to corresponding Subcategories (Cantos, Chapters, Lilas, Years).
This enables cascading dropdowns in the UI where Section dropdown options
match the selected primary Category.
"""

import json
import os
import re
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(REPO_ROOT, "data")
SPEAKERS_DIR = os.path.join(DATA_DIR, "speakers")

BHURIJANA_FILE = os.path.join(SPEAKERS_DIR, "bhurijana-das.json")
RGDG_FILE = os.path.join(SPEAKERS_DIR, "radha-govinda-das-goswami.json")


def classify_bhurijana(item):
    url = item.get("media_url", "")
    path = urllib.parse.unquote(urllib.parse.urlparse(url).path)
    sub = path.split("His_Grace_Bhurijana_Prabhu/")[-1]
    parts = sub.split("/")[:-1]  # folder path components

    top_folder = parts[0] if parts else "General"
    sub_folder = "/".join(parts[1:]) if len(parts) > 1 else ""

    category = "General Discourses"
    subcategory = "Discourses"

    if top_folder == "Bhagavad_Gita_lectures_verse_wise":
        category = "Bhagavad Gita Verse Wise"
        m = re.search(r"Chapter[-_\s]*(\d+)", sub_folder)
        subcategory = f"Chapter {int(m.group(1)):02d}" if m else sub_folder.replace("_", " ")
    elif top_folder == "Bhagavad_Gita_Overview":
        category = "Bhagavad Gita Overview"
        subcategory = "Overview"
    elif top_folder == "Srimad_Bhagavatam":
        category = "Srimad Bhagavatam (Canto-Wise)"
        m = re.search(r"Canto[-_\s]*(\d+)", sub_folder)
        subcategory = f"Canto {int(m.group(1)):02d}" if m else sub_folder.replace("_", " ")
    elif top_folder == "Srimad_Bhagavatam_Overview":
        category = "Srimad Bhagavatam Overview"
        m = re.search(r"Canto[-_\s]*(\d+)", sub_folder)
        subcategory = f"Canto {int(m.group(1)):02d}" if m else sub_folder.replace("_", " ")
    elif top_folder == "Bhakti_Sastri_Course":
        category = "Bhakti Sastri Course"
        clean = sub_folder.replace("_", " ")
        subcategory = "Bhagavad Gita Overview" if "Gita" in clean else ("Nectar of Devotion" if "Devotion" in clean else "Nectar of Instruction")
    elif top_folder == "Bhakti_Vaibhava_Course":
        category = "Bhakti Vaibhava Course"
        m = re.search(r"Canto[-_\s]*(\d+)", sub_folder)
        subcategory = f"Canto {int(m.group(1)):02d}" if m else sub_folder.replace("_", " ")
    elif top_folder in ["Chaitanya_Charitamrita", "Sri_Caitanya_Bhagavat"]:
        category = "Caitanya Caritāmṛta & Caitanya Bhagavata"
        clean = (sub_folder or top_folder).replace("_", " ")
        subcategory = clean
    elif top_folder == "Retreats":
        category = "Govardhana & Holy Name Retreats"
        m = re.search(r"(\d{4})", sub_folder)
        if m:
            subcategory = f"Govardhan Retreat {m.group(1)}"
        elif "Farm" in sub_folder:
            subcategory = "Farm Retreats"
        elif "Bombay" in sub_folder:
            subcategory = "Bombay 2006 Retreat"
        else:
            subcategory = sub_folder.replace("_", " ")
    elif top_folder == "Seminars":
        category = "Seminars & Courses"
        clean = sub_folder.replace("_", " ")
        if "Holyname" in clean or "Japa" in clean:
            subcategory = "Japa & Holy Name"
        else:
            subcategory = clean
    elif top_folder == "Art_of_Teaching":
        category = "Seminars & Courses"
        subcategory = "Art of Teaching"
    elif top_folder == "Queen_Kunti":
        category = "Prayers of Queen Kunti & Dhruva Maharaj"
        subcategory = "Queen Kunti Prayers"
    elif top_folder == "Dhruva_Maharaj":
        category = "Prayers of Queen Kunti & Dhruva Maharaj"
        subcategory = "Dhruva Maharaj Carita"
    elif top_folder in ["Krishna_Book", "Gopinath"]:
        category = "Krishna Book & Lila Katha"
        subcategory = "Krishna Book"
    elif top_folder in ["Isopanisad", "Nectar_of_Instruction"]:
        category = "Seminars & Courses"
        subcategory = "Sri Isopanisad & Upadesamrita"
    elif "Israel" in top_folder:
        category = "Seminars & Courses"
        m = re.search(r"(\d{4})", top_folder)
        subcategory = f"Israel Seminars ({m.group(1)})" if m else "Israel Seminars"
    elif top_folder in ["Festivals", "Bhajans"]:
        category = "Festivals & Various Discourses"
        subcategory = top_folder.replace("_", " ")
    else:
        category = "Festivals & Various Discourses"
        subcategory = "General Discourses"

    item["category"] = category
    item["subcategory"] = subcategory
    return item


def classify_rgdg(item):
    url = item.get("media_url", "")
    path = urllib.parse.unquote(urllib.parse.urlparse(url).path)
    sub = path.split("His_Holiness_Radha_Govinda_Swami/")[-1]
    parts = sub.split("/")[:-1]  # folder path components

    top = parts[0] if parts else "General"
    full_folder = "/".join(parts).lower()

    category = "Seminars & Special Discourses"
    subcategory = "General Katha"

    # 1. Canto-Wise Srimad Bhagavatam
    if "canto" in full_folder or top in ["00_-_Canto-Wise_Katha", "Srimad_Bhagavatam"]:
        category = "Srimad Bhagavatam (Canto-Wise)"
        m = re.search(r"canto[-_\s]*(\d+)", full_folder)
        if m:
            subcategory = f"Canto {int(m.group(1)):02d}"
        else:
            subcategory = "Various Cantos"

    # 2. Chaitanya Charitamrita & Gaura Katha
    elif any(k in full_folder for k in ["chaitanya", "gaur_katha", "rupa_siksha", "rupa_siskhya"]):
        category = "Caitanya Caritāmṛta & Gaura Katha"
        if "adi" in full_folder:
            subcategory = "Adi Lila"
        elif "madhya" in full_folder:
            subcategory = "Madhya Lila"
        elif "sanyasa" in full_folder:
            subcategory = "Caitanya Sannyasa"
        elif "rupa" in full_folder:
            subcategory = "Rupa Siksa"
        elif "gaur_katha" in full_folder:
            m = re.search(r"(\d{4})", full_folder)
            subcategory = f"Gaura Katha ({m.group(1)})" if m else "Gaura Katha"
        else:
            subcategory = "Mahaprabhu Lila"

    # 3. Ramayana & Lord Rama Katha
    elif any(k in full_folder for k in ["ram_katha", "ramayan"]):
        category = "Sri Ramayana & Lord Rama Katha"
        m = re.search(r"(\d{4})", full_folder)
        subcategory = f"Ramayana & Rama Katha ({m.group(1)})" if m else "Ramayana & Rama Katha"

    # 4. English Translation / Lectures
    elif "english" in full_folder:
        category = "Discourses with English Translation"
        clean = (parts[1] if len(parts) > 1 else top).replace("_", " ")
        subcategory = clean

    # 5. Bhagavata Saptah & Mahatmya
    elif any(k in full_folder for k in ["saptah", "bhagavad_dharma", "srimad_bhagavad_katha", "questions_by_parikshit"]):
        category = "Bhagavata Saptah & Mahatmya"
        if "saptah" in full_folder:
            m = re.search(r"(\d{4})", full_folder)
            subcategory = f"Bhagavata Saptah ({m.group(1)})" if m else "Bhagavata Saptah"
        elif "parikshit" in full_folder:
            subcategory = "Parikshit Maharaj Questions"
        else:
            subcategory = "Bhagavata Dharma & Mahatmya"

    # 6. Festivals & Utsavs
    elif any(k in full_folder for k in ["festival", "janmastami", "gita_jayanti", "amrit_mohatsav"]):
        category = "Vaishnava Festivals & Utsavs"
        if "janmastami" in full_folder:
            subcategory = "Sri Krishna Janmashtami"
        elif "gita" in full_folder:
            subcategory = "Gita Jayanti"
        elif "amrit" in full_folder:
            subcategory = "Amrit Mahotsav"
        else:
            subcategory = "Utsavs & Festivals"

    # 7. Srimad Bhagavatam Charitas & Prayers
    elif any(k in full_folder for k in [
        "dhruv", "prahalad", "prahlad", "ajamila", "bali_maharaj", "gajendra", "chitraketu",
        "kapila", "devahuti", "bhisma", "kunti", "bharat", "ambarish", "samudra_manthana",
        "navayogendra", "twenty_four_gurus", "vritasur", "yayati", "kasyap", "marutagana",
        "gaja_udharana", "payo_brata", "pariksit", "jada_bharat", "jayanti_maharaj"
    ]):
        category = "Srimad Bhagavatam Charitas & Prayers"
        if "prahalad" in full_folder or "prahlad" in full_folder:
            subcategory = "Prahlada Carita & Stuti"
        elif "dhruv" in full_folder:
            subcategory = "Dhruva Carita"
        elif "ajamila" in full_folder:
            subcategory = "Ajamila Upakhyana"
        elif "bali" in full_folder:
            subcategory = "Bali Maharaja Carita"
        elif "gajendra" in full_folder or "gaja_udharana" in full_folder:
            subcategory = "Gajendra Moksha"
        elif "chitraketu" in full_folder:
            subcategory = "Citraketu Carita"
        elif "bhisma" in full_folder:
            subcategory = "Bhishma Stuti"
        elif "kunti" in full_folder:
            subcategory = "Kunti Stuti"
        elif "bharat" in full_folder:
            subcategory = "Bharata Maharaja Carita"
        elif "ambarish" in full_folder:
            subcategory = "Ambarisha Carita"
        elif "kapila" in full_folder:
            subcategory = "Kapila & Devahuti Samvad"
        elif "samudra" in full_folder:
            subcategory = "Samudra Manthana"
        elif "navayogendra" in full_folder or "twenty_four_gurus" in full_folder:
            subcategory = "Navayogendra & 24 Gurus"
        elif "vritasur" in full_folder:
            subcategory = "Vritrasura Vadha"
        elif "yayati" in full_folder:
            subcategory = "Yayati Gita"
        else:
            subcategory = "Bhagavata Charitas"

    # 8. Krishna Lila Katha
    elif any(k in full_folder for k in [
        "damodar", "giriraj", "gopi_geet", "veenu", "venu", "bhramar", "janma", "advent",
        "baal", "baschal", "vatsalya", "putana", "kaliya", "bramha_vimohana", "brahma",
        "chirharan", "gocharan", "mathura", "dwarka", "rukmini", "uddhav", "kishore",
        "vrindavan_vihar", "dwagni", "akrura"
    ]):
        category = "Krishna Lila Katha"
        if "damodar" in full_folder:
            subcategory = "Damodara Lila"
        elif "giriraj" in full_folder:
            subcategory = "Giriraja Dharana"
        elif "gopi_geet" in full_folder:
            subcategory = "Gopi Gita"
        elif "veenu" in full_folder or "venu" in full_folder:
            subcategory = "Venu Gita"
        elif "bhramar" in full_folder:
            subcategory = "Bhramara Gita"
        elif any(j in full_folder for j in ["janma", "advent", "baal", "baschal", "vatsalya"]):
            subcategory = "Krishna Janma & Bala Lila"
        elif "putana" in full_folder:
            subcategory = "Putana Vadha"
        elif "kaliya" in full_folder:
            subcategory = "Kaliya Daman"
        elif "bramha" in full_folder or "brahma" in full_folder:
            subcategory = "Brahma Vimohana Lila"
        elif "chirharan" in full_folder:
            subcategory = "Vastra Harana Lila"
        elif "gocharan" in full_folder:
            subcategory = "Gocharana Lila"
        elif "akrura" in full_folder:
            subcategory = "Akrura Agamana & Milan"
        elif "mathura" in full_folder:
            subcategory = "Mathura Lila"
        elif "dwarka" in full_folder:
            subcategory = "Dvaraka Lila"
        elif "rukmini" in full_folder:
            subcategory = "Rukmini Kalyana"
        elif "uddhav" in full_folder:
            subcategory = "Uddhava Sandesha"
        else:
            subcategory = "Vrindavan Lila Katha"

    elif "seminars" in full_folder or "grihasthi" in full_folder:
        category = "Seminars & Special Discourses"
        clean = (parts[1] if len(parts) > 1 else top).replace("_", " ")
        subcategory = clean
    else:
        category = "Seminars & Special Discourses"
        subcategory = "General Katha"

    item["category"] = category
    item["subcategory"] = subcategory
    return item


def main():
    print("Reclassifying IDT audio archives for Bhurijana Das and Radha Govinda Das Goswami...")

    # 1. Bhurijana Das
    if os.path.exists(BHURIJANA_FILE):
        with open(BHURIJANA_FILE, "r", encoding="utf-8") as f:
            bhurijana = json.load(f)
        bhurijana = [classify_bhurijana(item) for item in bhurijana]
        with open(BHURIJANA_FILE, "w", encoding="utf-8") as f:
            json.dump(bhurijana, f, indent=2, ensure_ascii=False)
        print(f"✅ Reclassified {len(bhurijana)} lectures for Bhurijana Das.")

    # 2. Radha Govinda Das Goswami
    if os.path.exists(RGDG_FILE):
        with open(RGDG_FILE, "r", encoding="utf-8") as f:
            rgdg = json.load(f)
        rgdg = [classify_rgdg(item) for item in rgdg]
        with open(RGDG_FILE, "w", encoding="utf-8") as f:
            json.dump(rgdg, f, indent=2, ensure_ascii=False)
        print(f"✅ Reclassified {len(rgdg)} lectures for Radha Govinda Das Goswami.")


if __name__ == "__main__":
    main()
