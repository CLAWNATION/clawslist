# Video to Skill Workflow

Turn any YouTube video into a reusable OpenClaw skill.

## Quick Start

### 1. Install Dependencies

```bash
pip install youtube-transcript-api
```

### 2. Convert a Video to Skill

```bash
python3 scripts/video_to_skill.py \
    "https://youtu.be/H6VoyCgCklA" \
    --title "Docker Container Best Practices" \
    --category "devops" \
    --tags "docker,containers,deployment,devops"
```

### 3. Review and Edit

The script creates:
```
skills/
└── docker_container_best_practices/
    ├── SKILL.md          # Structured skill documentation
    └── transcript.txt    # Full video transcript
```

Open `SKILL.md` and:
- ✅ Verify key points are accurate
- 📝 Add any missing context
- 🔗 Update resource links
- 🏷️ Adjust tags as needed

### 4. Use Your Skill

Move the skill folder to your workspace skills directory:
```bash
mv skills/docker_container_best_practices ~/.openclaw/workspace/skills/
```

Now you can reference it in any conversation!

---

## Workflow Options

### Option A: Telegram Share (Recommended)

1. Watch a video on YouTube
2. Click Share → Copy Link
3. Send to your OpenClaw agent:
   ```
   Save this as a skill about Docker: https://youtu.be/...
   ```
4. Agent processes and confirms

### Option B: Batch Processing

Create a `videos_to_process.txt`:
```
https://youtu.be/VIDEO1 | Kubernetes Basics | devops
https://youtu.be/VIDEO2 | React Hooks Deep Dive | frontend
https://youtu.be/VIDEO3 | PostgreSQL Optimization | database
```

Process all:
```bash
while IFS='|' read url title category; do
    python3 scripts/video_to_skill.py "$url" --title "$title" --category "$category"
done < videos_to_process.txt
```

### Option C: Browser Bookmarklet

Create a bookmark with this URL:
```javascript
javascript:(function(){
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://t.me/your_bot?start=skill_${url}_${title}`);
})();
```

Click it on any YouTube video to share to your agent.

---

## Skill Structure

Each generated skill includes:

| Section | Content |
|---------|---------|
| **Summary** | TL;DR of the video |
| **Key Points** | Important concepts and takeaways |
| **Commands** | Shell commands demonstrated |
| **Code Examples** | Code snippets from the video |
| **Resources** | URLs mentioned in the video |
| **Full Transcript** | Complete searchable text |

---

## Examples

### DevOps Video
```bash
python3 scripts/video_to_skill.py \
    "https://youtu.be/some-docker-video" \
    --title "Docker Multi-Stage Builds" \
    --category "devops" \
    --tags "docker,optimization,cicd"
```

### Programming Tutorial
```bash
python3 scripts/video_to_skill.py \
    "https://youtu.be/some-rust-video" \
    --title "Rust Ownership Explained" \
    --category "programming" \
    --tags "rust,memory,systems"
```

### Business/Marketing
```bash
python3 scripts/video_to_skill.py \
    "https://youtu.be/some-marketing-video" \
    --title "YouTube SEO Strategy" \
    --category "marketing" \
    --tags "youtube,seo,content"
```

---

## Tips

1. **Choose descriptive titles** - Makes skills easier to find
2. **Use consistent categories** - Helps with organization
3. **Add relevant tags** - Improves searchability
4. **Review before committing** - AI extraction isn't perfect
5. **Add your own notes** - Personalize the skill with your insights

---

## Troubleshooting

**"No transcript available"**
- Video may not have captions
- Try auto-generated captions: `--auto-generated`

**"Video unavailable"**
- Video may be private or region-restricted
- Check if you can watch it in browser

**"Transcript too long"**
- Long videos (>2 hours) may need manual editing
- Focus on key timestamps first

---

## Future Enhancements

- [ ] Multi-video skill merging
- [ ] Timestamp linking
- [ ] Video chapter extraction
- [ ] Automatic tagging with NLP
- [ ] Skill quality scoring

---

*Workflow created for 0xBuildR*
