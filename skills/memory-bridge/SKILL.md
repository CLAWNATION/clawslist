---
name: memory-bridge
description: Automatically summarize OpenClaw sessions into memory files and provide cross-session context continuity. Use when managing memory files, setting up automated session summarization, extracting key decisions/facts/preferences/todos from sessions, or maintaining MEMORY.md and daily memory files for agent continuity across sessions.
---

# Memory Bridge

## Overview

Memory Bridge provides automated session summarization and cross-session memory management for OpenClaw agents. It extracts key information from session JSONL files and maintains organized memory files for agent continuity.

## Key Features

- **Session Analysis**: Reads and parses OpenClaw session JSONL files
- **Smart Extraction**: Identifies decisions, facts, preferences, and todos from conversations
- **Memory Organization**: Creates daily memory files (`memory/YYYY-MM-DD.md`) and updates long-term `MEMORY.md`
- **Automated Summarization**: Can run via cron for hands-off operation

## Quick Start

### 1. Manual Session Processing

Process recent sessions manually:

```bash
# Process all sessions from the last 24 hours
python3 ~/.openclaw/workspace/skills/memory-bridge/scripts/session-to-memory.py --agent-id <agent-id>

# Process sessions from a specific date range
python3 ~/.openclaw/workspace/skills/memory-bridge/scripts/session-to-memory.py --agent-id <agent-id> --since 2026-01-15 --until 2026-01-20

# Dry run to preview what would be extracted
python3 ~/.openclaw/workspace/skills/memory-bridge/scripts/session-to-memory.py --agent-id <agent-id> --dry-run
```

### 2. Automated Setup (Cron)

Add to crontab for automatic processing:

```bash
# Edit crontab
crontab -e

# Add entry to run every hour (adjust as needed)
0 * * * * cd /root/.openclaw/workspace && python3 skills/memory-bridge/scripts/session-to-memory.py --agent-id main >> /var/log/memory-bridge.log 2>&1

# Or run daily at midnight
0 0 * * * cd /root/.openclaw/workspace && python3 skills/memory-bridge/scripts/session-to-memory.py --agent-id main --daily-summary >> /var/log/memory-bridge.log 2>&1
```

## Session-to-Memory Script

**Location**: `scripts/session-to-memory.py`

### Usage

```bash
python3 session-to-memory.py --agent-id <agent-id> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--agent-id` | **Required**. The agent ID to process sessions for |
| `--since DATE` | Process sessions from this date (YYYY-MM-DD) |
| `--until DATE` | Process sessions until this date (YYYY-MM-DD) |
| `--dry-run` | Preview extractions without writing files |
| `--daily-summary` | Generate consolidated daily summaries |
| `--update-memory-md` | Force update of MEMORY.md with important items |
| `--max-sessions N` | Limit to N most recent sessions |

### What Gets Extracted

The script identifies and categorizes:

- **Decisions**: Choices made, plans agreed upon, conclusions reached
- **Facts**: Information learned, data discovered, context established
- **Preferences**: User preferences, settings chosen, style established
- **Todos**: Action items, follow-ups, tasks assigned
- **Errors/Mistakes**: Issues encountered, lessons learned

## Memory File Structure

**See**: `references/memory-structure.md` for complete structure reference.

### Daily Files: `memory/YYYY-MM-DD.md`

Raw session summaries organized by date:

```markdown
# Memory Log - 2026-02-03

## Session: main-20260203-143022
**Duration**: 45 minutes
**Topics**: project setup, API configuration

### Decisions
- Chose PostgreSQL over MySQL for the project

### Facts Learned
- API rate limit is 1000 requests/hour

### Preferences
- Prefers dark mode for all interfaces

### Todos
- [ ] Set up database migrations
```

### Long-term: `MEMORY.md`

Curated important information that persists across sessions:

```markdown
# Agent Memory

## User Preferences
- Dark mode preferred
- Notification style: brief

## Project Context
- Current project: OpenClaw Dashboard
- Tech stack: Python, React, PostgreSQL

## Important Decisions
- 2026-02-03: PostgreSQL chosen for database
```

## Best Practices

### For Daily Files

1. **Keep them chronological** - One file per day
2. **Include session IDs** - For traceability back to source
3. **Be concise** - Summaries, not transcripts
4. **Categorize clearly** - Use consistent headers

### For MEMORY.md

1. **Curate ruthlessly** - Only keep what matters long-term
2. **Update regularly** - Review and prune outdated info
3. **Organize by topic** - Group related information
4. **Include dates** - When decisions were made

### Automation Tips

1. **Start with dry-run** - Verify extraction quality before automation
2. **Log output** - Redirect script output to a log file
3. **Review weekly** - Check MEMORY.md periodically for relevance
4. **Backup** - Consider git-tracking your memory files

## Troubleshooting

### Sessions Not Found

Ensure the path is correct:
```bash
ls ~/.openclaw/agents/<agent-id>/sessions/
```

### Permission Errors

The script needs read access to session files and write access to memory directory:
```bash
chmod +x ~/.openclaw/workspace/skills/memory-bridge/scripts/session-to-memory.py
```

### Empty Extractions

If no content is being extracted:
- Check session files contain actual conversation data
- Verify JSONL format is valid
- Review extraction patterns in the script

## Advanced Configuration

### Custom Extraction Patterns

Edit the script to adjust what gets extracted:

```python
# In session-to-memory.py, modify these patterns:
DECISION_PATTERNS = [
    r"(?i)(?:decided?|agreed?|concluded?|chose)\s+(?:to\s+)?(.+)",
    # Add your patterns here
]
```

### Custom Output Format

Modify the `format_entry()` function to change how entries are written:

```python
def format_entry(category, content, timestamp=None):
    # Custom formatting logic
    return f"- [{timestamp}] {content}\n"
```
