#!/usr/bin/env python3
"""
Batch ingest all requested YouTube playlists with their authentic playlist titles for:
- Balaram Shakti Das
- Madhavananda Das
- Indradyumna Swami
"""
import sys
import os
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ONBOARD_SCRIPT = os.path.join(SCRIPT_DIR, "onboard_youtube.py")

PLAYLISTS = [
    # Amarendra Das (Authentic YouTube Playlist Titles)
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLIcxMV4k2-aU",
        "category": "Kārtika Hindi Kathā 2026 - दामोदर लीला",
    },
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLaHRUVhq1CVU",
        "category": "Kārtika English Kathā 2026 - Caitanya Mahāprabhu instructs Sanātana Gosvāmī",
    },
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLJSHQ35mhErtj61T9vRcj9UROVpneyl97",
        "category": "Venu Gīta | Kartik Kathā 2025",
    },
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLJSHQ35mhErtYaP_0KygXhprBHZhYIKm3",
        "category": "Childhood Pastimes of Kṛṣṇa | Kartik Kathā 2025",
    },
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLJSHQ35mhEruCEVyiEjQJVZpAij7xAU_u",
        "category": "Śrīmad Bhāgavatam Canto 7",
    },
    {
        "speaker": "Amarendra Das",
        "url": "https://www.youtube.com/playlist?list=PLJSHQ35mhErtLnbKhUq65rIxpM374qDgz",
        "category": "Kārtika Kathā 2024 (ISKCON Atlanta)",
    },
    # Balaram Shakti Das
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGFjkvmyvasvi8c52btP4vPU",
        "category": "Bhakti Sandarbha",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGEGMDVh5R8-kUfYE-0oBnKR",
        "category": "BRS Southern Section",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGGPpulciDjFhAqMDG1Cn2ix",
        "category": "Tattva Sandarbha",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGHQx2O4b_DC2wdSSsR03q-G",
        "category": "Raga Vartma Chandrika",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGE2cweuW3DodJSQwlFB8ivp",
        "category": "Brhad Bhagavatamrta Vol 1 - Narada Muni's Journey",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLOlsz8SWVWGHAwBMZObnAyK65eBSGqiLE",
        "category": "Brhad Bhagavatamrta Vol 2 - Gopa Kumar's Journey",
    },
    {
        "speaker": "Balaram Shakti Das",
        "url": "https://www.youtube.com/playlist?list=PLP3jBUDmoHYI",
        "category": "Gopal Champu (Purva)",
    },
    # Madhavananda Das (Authentic YouTube Playlist Titles)
    {
        "speaker": "Madhavananda Das",
        "url": "https://www.youtube.com/playlist?list=PLDXWEweAZ-pw3CwF3GUBsoDnzw-Y8YKsC",
        "category": "Embankment of Separation",
    },
    {
        "speaker": "Madhavananda Das",
        "url": "https://www.youtube.com/playlist?list=PLDXWEweAZ-pw95aDUgQlF8ccWsiNGKEmq",
        "category": "Lives of the Acaryas",
    },
    {
        "speaker": "Madhavananda Das",
        "url": "https://www.youtube.com/playlist?list=PLDXWEweAZ-pzMpUMyZV1eiLEcRZDIyMUT",
        "category": "Prema-bhakti-candrika",
    },
    {
        "speaker": "Madhavananda Das",
        "url": "https://www.youtube.com/playlist?list=PLDXWEweAZ-pxkyu2w3sbFth5-s5RS2WK_",
        "category": "In Search of a True Disciple",
    },
    # Indradyumna Swami (Authentic YouTube Playlist Titles)
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBgw1ZMuwLBL5FQQyRvroWc",
        "category": "Stimulation for Ecstatic Love",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhCDyIMvwy36nK7tmytl3DWe",
        "category": "The Binding Rope of Spotless Love",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhCfiPsHp584DLzWzo0zDVMJ",
        "category": "Samadhis of the Acaryas",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhDGa3W65fflCzwFiQ7ImAfo",
        "category": "Historical Vrindavan",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhC040mTKQyiqTssxClF4aW3",
        "category": "Monsoon Season",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhAMuFQTTfla5dhYaL3bCGC2",
        "category": "Lord Caitanya in Vrindavan, Gaya, Jarikhanda, Mayapur",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhC2yxu9Oi-nAF4ID_UZm9dZ",
        "category": "Summer Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhDz-OXekrxP7q5hXE_BJRGB",
        "category": "Spring Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhCqhRZErF62u2UYwyP_8mRl",
        "category": "Madan Mohan",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhC1485mDr_fhcEpGJaq0iLr",
        "category": "Daily Pastimes (asta-kaliya lila)",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBzwpKJ6Uh6_R_m02KE46x1",
        "category": "Winter Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBHjWJLR4z6UcV_TKONyOID",
        "category": "The Rasa Dance",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBxsn_DwMrRLFYDhpXobjOy",
        "category": "Asta Sakhi Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBtQFPhFIgwNOojDpu0xrf8",
        "category": "The Hidden Pastimes of Govindaji",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhDXZQgxERjJDkrEz-nfHpjd",
        "category": "Yavat Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhDvQoq40EtrJsj0kRKV8onS",
        "category": "Just Wander!",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhD1HiBBFWWW7uQSnz_HjfOJ",
        "category": "Govardhan Pastimes",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhAi5jatvMqihUTT1niDBmTs",
        "category": "Vaisnava Acaryas",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhBBPsv21Led3sxpgFqJa9jd",
        "category": "Sub-Forests of Vrindavan",
    },
    {
        "speaker": "Indradyumna Swami",
        "url": "https://www.youtube.com/playlist?list=PLOLQFA19eqhA-5ZWgMQqTDwSHzH9u7taA",
        "category": "Twelve Forests of Vrindavan",
    },
]


def main():
    print(f"Starting batch onboarding for {len(PLAYLISTS)} playlists...")
    # Clear existing speaker files for the re-categorized speakers so new categories apply cleanly
    recat_speakers = ["madhavananda-das.json", "indradyumna-swami.json", "balaram-shakti-das.json"]
    for s_file in recat_speakers:
        p = os.path.join(os.path.dirname(SCRIPT_DIR), "data", "speakers", s_file)
        if os.path.exists(p):
            os.remove(p)

    for idx, item in enumerate(PLAYLISTS, 1):
        print(f"\n[{idx}/{len(PLAYLISTS)}] {item['speaker']} - {item['category']}")
        cmd = [
            sys.executable,
            ONBOARD_SCRIPT,
            "--url",
            item["url"],
            "--speaker",
            item["speaker"],
            "--category",
            item["category"],
        ]
        res = subprocess.run(cmd)
        if res.returncode != 0:
            print(f"Warning: Failed processing {item['url']}")

    print("\n✅ All YouTube playlists processed with exact authentic titles.")


if __name__ == "__main__":
    main()
