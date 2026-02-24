#!/usr/bin/env python3
"""
Video to Skill Converter

Converts YouTube videos (or any video with transcripts) into OpenClaw skill files.
Extracts key concepts, code, instructions, and formats them as structured documentation.

Requirements:
    pip install youtube-transcript-api

Usage:
    python3 video_to_skill.py <youtube_url> --title "Skill Name" --category "category"
    
Example:
    python3 video_to_skill.py https://youtu.be/H6VoyCgCklA \
        --title "Docker Best Practices" \
        --category "devops" \
        --tags "docker,containers,deployment"
"""

import sys
import re
import os
import argparse
from datetime import datetime
from urllib.parse import urlparse

def extract_video_id(url):
    """Extract YouTube video ID from URL."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If it's just an ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    return None

def get_transcript(video_id):
    """Fetch transcript from YouTube."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        print("Error: youtube-transcript-api not installed.")
        print("Install with: pip install youtube-transcript-api")
        sys.exit(1)
    
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try English first
        try:
            transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        except:
            transcript = list(transcript_list)[0]
        
        data = transcript.fetch()
        return ' '.join([entry.get('text', '') for entry in data]), transcript.language
    
    except Exception as e:
        print(f"Error fetching transcript: {e}")
        return None, None

def extract_sections(text):
    """Extract structured sections from transcript."""
    sections = {
        'summary': '',
        'key_points': [],
        'code_examples': [],
        'commands': [],
        'resources': []
    }
    
    # Extract what looks like code/commands
    lines = text.split('. ')
    
    for line in lines:
        line = line.strip()
        
        # Look for shell commands
        if re.match(r'^(npm|pip|docker|git|curl|wget|sudo|apt|brew)\s', line):
            sections['commands'].append(line)
        
        # Look for code-like patterns
        elif re.match(r'^[\w\-]+\s*=\s*[\'"\[]', line) or 'function' in line or 'class' in line:
            sections['code_examples'].append(line)
        
        # Look for URLs
        urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', line)
        sections['resources'].extend(urls)
        
        # Key indicators for important points
        elif any(kw in line.lower() for kw in ['important', 'note', 'remember', 'key', 'tip', 'warning']):
            sections['key_points'].append(line)
    
    # First few sentences as summary
    sections['summary'] = '. '.join(lines[:3]) + '.'
    
    return sections

def create_skill_file(video_id, title, category, tags, transcript, sections, output_dir):
    """Create a SKILL.md file from video content."""
    
    safe_name = re.sub(r'[^\w\-]', '_', title.lower())
    skill_dir = os.path.join(output_dir, safe_name)
    os.makedirs(skill_dir, exist_ok=True)
    
    skill_content = f"""---
name: {safe_name}
description: {sections['summary'][:100]}...
category: {category}
tags: {tags}
source: https://youtu.be/{video_id}
extracted: {datetime.now().strftime('%Y-%m-%d')}
---

# {title}

> Learned from: [YouTube Video](https://youtu.be/{video_id})
> Extracted on: {datetime.now().strftime('%Y-%m-%d')}

## Summary

{sections['summary']}

## Key Points

"""
    
    if sections['key_points']:
        for point in sections['key_points'][:10]:
            skill_content += f"- {point}\n"
    else:
        # Extract bullet points from transcript
        sentences = transcript.split('. ')
        for sent in sentences[:5]:
            if len(sent) > 20:
                skill_content += f"- {sent.strip()}.\n"
    
    if sections['commands']:
        skill_content += "\n## Commands
\n```bash\n"
        for cmd in sections['commands'][:10]:
            skill_content += f"{cmd}\n"
        skill_content += "```\n"
    
    if sections['code_examples']:
        skill_content += "\n## Code Examples
\n```\n"
        for code in sections['code_examples'][:5]:
            skill_content += f"{code}\n"
        skill_content += "```\n"
    
    if sections['resources']:
        skill_content += "\n## Resources
\n"
        for url in list(set(sections['resources']))[:10]:
            skill_content += f"- [{url}]({url})\n"
    
    skill_content += f"""
## Full Transcript

<details>
<summary>Click to expand full transcript</summary>

{transcript[:2000]}...

[View full video](https://youtu.be/{video_id})
</details>

## Usage

```bash
# Reference this skill
python3 -m openclaw.skills.{safe_name}
```

---

*This skill was auto-generated from a YouTube video. Review and verify information before use.*
"""
    
    skill_path = os.path.join(skill_dir, 'SKILL.md')
    with open(skill_path, 'w', encoding='utf-8') as f:
        f.write(skill_content)
    
    # Also save raw transcript
    transcript_path = os.path.join(skill_dir, 'transcript.txt')
    with open(transcript_path, 'w', encoding='utf-8') as f:
        f.write(f"Source: https://youtu.be/{video_id}\n")
        f.write(f"Title: {title}\n")
        f.write(f"Extracted: {datetime.now().strftime('%Y-%m-%d')}\n")
        f.write("="*60 + "\n\n")
        f.write(transcript)
    
    return skill_dir

def main():
    parser = argparse.ArgumentParser(description='Convert YouTube videos to OpenClaw skills')
    parser.add_argument('url', help='YouTube URL or video ID')
    parser.add_argument('--title', '-t', required=True, help='Skill title')
    parser.add_argument('--category', '-c', default='general', help='Skill category')
    parser.add_argument('--tags', '-g', default='', help='Comma-separated tags')
    parser.add_argument('--output', '-o', default='./skills', help='Output directory')
    
    args = parser.parse_args()
    
    # Extract video ID
    video_id = extract_video_id(args.url)
    if not video_id:
        print(f"Error: Could not extract video ID from '{args.url}'")
        sys.exit(1)
    
    print(f"📺 Processing video: {video_id}")
    print(f"📝 Title: {args.title}")
    
    # Get transcript
    transcript, language = get_transcript(video_id)
    if not transcript:
        print("❌ Failed to fetch transcript")
        sys.exit(1)
    
    print(f"🌍 Language: {language}")
    print(f"📄 Transcript length: {len(transcript)} characters")
    
    # Extract sections
    print("🔍 Extracting key information...")
    sections = extract_sections(transcript)
    
    # Create skill file
    print("💾 Creating skill files...")
    skill_dir = create_skill_file(
        video_id, 
        args.title, 
        args.category, 
        args.tags,
        transcript, 
        sections,
        args.output
    )
    
    print(f"\n✅ Skill created!")
    print(f"   📁 Directory: {skill_dir}")
    print(f"   📄 SKILL.md: {os.path.join(skill_dir, 'SKILL.md')}")
    print(f"   📝 Transcript: {os.path.join(skill_dir, 'transcript.txt')}")
    print(f"\n🚀 Next steps:")
    print(f"   1. Review and edit {os.path.join(skill_dir, 'SKILL.md')}")
    print(f"   2. Test the skill")
    print(f"   3. Commit to your skills repo")

if __name__ == "__main__":
    main()
