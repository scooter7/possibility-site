#!/usr/bin/env python3
"""
Scrape YouTube transcripts for Jim Curtis podcast appearances.
Uses youtube-transcript-api to grab auto-generated captions.
"""

import json
import os
import re
import sys
from urllib.request import urlopen, Request
from urllib.parse import quote_plus
from youtube_transcript_api import YouTubeTranscriptApi

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "transcripts")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def search_youtube(query, max_results=10):
    """Search YouTube and extract video IDs from the HTML."""
    url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urlopen(req).read().decode("utf-8")

    # Extract video IDs from the page
    video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
    # Deduplicate while preserving order
    seen = set()
    unique_ids = []
    for vid in video_ids:
        if vid not in seen:
            seen.add(vid)
            unique_ids.append(vid)
            if len(unique_ids) >= max_results:
                break

    # Try to extract titles too
    titles = re.findall(r'"title":\{"runs":\[\{"text":"(.*?)"\}', html)

    results = []
    for i, vid_id in enumerate(unique_ids):
        title = titles[i] if i < len(titles) else f"Video {vid_id}"
        results.append({"id": vid_id, "title": title})

    return results


def get_transcript(video_id):
    """Get transcript for a YouTube video."""
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        # Combine all snippets into full text
        full_text = " ".join(snippet.text for snippet in transcript.snippets)
        return full_text
    except Exception as e:
        return f"ERROR: {e}"


def sanitize_filename(title):
    """Make a safe filename from a video title."""
    safe = re.sub(r'[^\w\s-]', '', title)
    safe = re.sub(r'\s+', '_', safe.strip())
    return safe[:80]


def main():
    queries = [
        "Jim Curtis hypnotist podcast interview",
        "Jim Curtis Lewis Howes School of Greatness",
        "Jim Curtis Book of Possibility",
        "Jim Curtis manifestation hypnosis interview",
    ]

    all_videos = {}

    print("=== Searching YouTube for Jim Curtis videos ===\n")
    for query in queries:
        print(f"Searching: {query}")
        try:
            results = search_youtube(query, max_results=5)
            for r in results:
                if r["id"] not in all_videos:
                    all_videos[r["id"]] = r["title"]
                    print(f"  Found: {r['title']} ({r['id']})")
        except Exception as e:
            print(f"  Search error: {e}")

    print(f"\n=== Found {len(all_videos)} unique videos. Fetching transcripts... ===\n")

    success_count = 0
    for vid_id, title in all_videos.items():
        print(f"Fetching transcript: {title}...")
        transcript = get_transcript(vid_id)

        if transcript.startswith("ERROR:"):
            print(f"  SKIPPED: {transcript}")
            continue

        filename = f"{sanitize_filename(title)}.txt"
        filepath = os.path.join(OUTPUT_DIR, filename)

        with open(filepath, "w") as f:
            f.write(f"Title: {title}\n")
            f.write(f"Video ID: {vid_id}\n")
            f.write(f"URL: https://www.youtube.com/watch?v={vid_id}\n")
            f.write(f"{'='*60}\n\n")
            f.write(transcript)

        word_count = len(transcript.split())
        print(f"  Saved: {filename} ({word_count} words)")
        success_count += 1

    print(f"\n=== Done! {success_count} transcripts saved to {OUTPUT_DIR}/ ===")


if __name__ == "__main__":
    main()
