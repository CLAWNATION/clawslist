#!/usr/bin/env python3
"""
YouTube Caption Downloader

Downloads captions/transcripts from YouTube videos and saves them as text files.

Requirements:
    pip install youtube-transcript-api

Usage:
    python3 download_captions.py <youtube_url_or_id>
    python3 download_captions.py https://youtu.be/H6VoyCgCklA
    python3 download_captions.py H6VoyCgCklA
"""

import sys
import re
import os
from urllib.parse import urlparse, parse_qs

def extract_video_id(url_or_id):
    """Extract YouTube video ID from URL or return ID if already provided."""
    # If it's just an ID (11 characters, alphanumeric)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
    
    # Extract from various YouTube URL formats
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    
    return None

def download_captions(video_id, output_dir="./transcripts"):
    """Download captions for a YouTube video."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        print("Error: youtube-transcript-api not installed.")
        print("Install with: pip install youtube-transcript-api")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Get list of available transcripts
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        print(f"Available transcripts for {video_id}:")
        for transcript in transcript_list:
            print(f"  - {transcript.language} ({transcript.language_code})")
        
        # Try to get English transcript first, then any available
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        except:
            # Get first available transcript
            transcript = list(transcript_list)[0]
        
        # Fetch the transcript data
        transcript_data = transcript.fetch()
        
        # Build text content
        full_text = []
        for entry in transcript_data:
            text = entry.get('text', '').strip()
            if text:
                full_text.append(text)
        
        # Create filename
        safe_title = f"{video_id}_transcript"
        filename = os.path.join(output_dir, f"{safe_title}.txt")
        
        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"YouTube Video: {video_id}\n")
            f.write(f"Language: {transcript.language} ({transcript.language_code})\n")
            f.write(f"Auto-generated: {transcript.is_generated}\n")
            f.write("=" * 60 + "\n\n")
            f.write('\n'.join(full_text))
        
        print(f"\n✅ Transcript saved to: {filename}")
        print(f"   Language: {transcript.language}")
        print(f"   Lines: {len(full_text)}")
        
        return filename
        
    except Exception as e:
        print(f"Error downloading captions: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 download_captions.py <youtube_url_or_id>")
        print("Example: python3 download_captions.py https://youtu.be/H6VoyCgCklA")
        sys.exit(1)
    
    url_or_id = sys.argv[1]
    video_id = extract_video_id(url_or_id)
    
    if not video_id:
        print(f"Error: Could not extract video ID from '{url_or_id}'")
        print("Please provide a valid YouTube URL or video ID")
        sys.exit(1)
    
    print(f"Video ID: {video_id}")
    download_captions(video_id)

if __name__ == "__main__":
    main()
