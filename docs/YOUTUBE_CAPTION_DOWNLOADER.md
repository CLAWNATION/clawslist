# YouTube Caption Downloader Agent

This tool downloads captions/transcripts from YouTube videos and saves them as text files.

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install youtube-transcript-api

# Or if using uv
uv pip install youtube-transcript-api
```

### 2. Usage

```bash
# Download captions for a video
python3 scripts/download_captions.py <youtube_url_or_id>

# Examples:
python3 scripts/download_captions.py https://youtu.be/H6VoyCgCklA
python3 scripts/download_captions.py H6VoyCgCklA
python3 scripts/download_captions.py "https://www.youtube.com/watch?v=H6VoyCgCklA"
```

### 3. Output

Transcripts are saved to `./transcripts/` directory as text files:
- Format: `{video_id}_transcript.txt`
- Includes metadata (language, auto-generated status)
- Full transcript text

## Features

- ✅ Extracts video ID from any YouTube URL format
- ✅ Auto-detects available languages
- ✅ Prefers English transcripts, falls back to any available
- ✅ Handles auto-generated captions
- ✅ Saves clean text output

## Limitations

- Only works on videos with captions/subtitles enabled
- Some videos may have restricted transcripts
- Auto-generated captions may have transcription errors

## Alternative: Using yt-dlp

If youtube-transcript-api doesn't work, you can use yt-dlp:

```bash
# Install yt-dlp
pip install yt-dlp

# Download subtitles only
yt-dlp --list-subs "https://youtu.be/H6VoyCgCklA"
yt-dlp --write-subs --sub-langs en --skip-download "https://youtu.be/H6VoyCgCklA"
```

## Batch Processing

To download captions for multiple videos, create a list:

```bash
# videos.txt - one URL per line
# https://youtu.be/VIDEO1
# https://youtu.be/VIDEO2

while read url; do
    python3 scripts/download_captions.py "$url"
done < videos.txt
```

---

*Created for 0xBuildR*
