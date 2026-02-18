# Memory File Structure Reference

This document describes the organization and best practices for OpenClaw memory files.

## File Overview

```
workspace/
├── memory/
│   ├── 2026-02-01.md      # Daily memory file
│   ├── 2026-02-02.md      # Daily memory file
│   └── 2026-02-03.md      # Daily memory file
├── MEMORY.md              # Long-term curated memory
└── AGENTS.md              # Agent identity and conventions
```

## Daily Memory Files (`memory/YYYY-MM-DD.md`)

### Purpose

Daily files are raw, chronological logs of session summaries. They serve as:
- A searchable archive of what happened each day
- Source material for updating long-term memory
- Context for understanding recent activities

### File Naming

- Format: `YYYY-MM-DD.md` (ISO 8601 date)
- Location: `workspace/memory/`
- Created: Automatically by memory-bridge script

### Structure Template

```markdown
# Memory Log - 2026-02-03

## Session: <session-id>
**Duration**: 45 minutes  
**Topics**: project setup, API configuration, database

### Decisions
- Chose PostgreSQL over MySQL for new project
- Decided to use React for frontend

### Facts Learned
- API rate limit is 1000 requests/hour
- Database connection pool max is 20

### Preferences
- User prefers dark mode interfaces
- Prefers concise over verbose responses

### Todos
- [ ] Set up database migrations
- [ ] Configure API keys
- [ ] Write documentation

### Errors/Lessons
- Mistake: Forgot to commit before switching branches
- Lesson: Always test in staging first

---

## Session: <another-session-id>
...
```

### Content Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Decisions** | Choices made, plans agreed upon | "Chose PostgreSQL over MySQL" |
| **Facts** | Information learned, data discovered | "API rate limit is 1000/hour" |
| **Preferences** | User preferences, style choices | "Prefers dark mode" |
| **Todos** | Action items, follow-ups | "[ ] Set up database" |
| **Errors** | Issues encountered, mistakes made | "Forgot to commit changes" |

## Long-term Memory (`MEMORY.md`)

### Purpose

MEMORY.md contains curated, long-term information that should persist across many sessions:
- User preferences and personality
- Important decisions and their rationale
- Project context and current status
- Lessons learned that shouldn't be forgotten

### Structure

```markdown
# Agent Memory

## User Profile

### Preferences
- **Communication style**: Concise, direct
- **Interface**: Dark mode preferred
- **Notifications**: Brief, not verbose
- **Timezone**: America/New_York

### Interests
- Programming: Python, TypeScript
- Projects: OpenClaw, personal dashboard
- Learning: AI/ML, system design

## Current Projects

### OpenClaw Dashboard
- **Status**: In development
- **Tech stack**: React, Python, PostgreSQL
- **Last updated**: 2026-02-03
- **Next milestone**: Beta release

## Important Decisions

### Architecture (2026-02-03)
- Chose PostgreSQL for relational data
- Chose Redis for caching
- Monorepo structure with pnpm workspaces

### Workflow (2026-01-15)
- Commit early, commit often
- Test in staging before production
- Weekly code reviews on Fridays

## Persistent Context

### Development Environment
- Editor: VS Code with Vim extension
- Terminal: iTerm2 with Zsh
- Docker for local services

### API Keys & Services
- Note: Store in .env files, never commit
- OpenAI API for LLM features
- Stripe for payments

## Lessons Learned

### Technical
- Always use connection pooling for databases
- Rate limiting is essential from day one

### Process
- Write tests before fixing bugs
- Document decisions in ADRs
```

### Best Practices

1. **Curate ruthlessly** - Not everything belongs here
2. **Organize by topic** - Group related information
3. **Include dates** - When decisions were made
4. **Review periodically** - Remove outdated info
5. **Keep it scannable** - Use headers and bullet points

## Memory Maintenance Workflow

### Weekly Review (Automated via cron)

```bash
# Run memory bridge to process recent sessions
python3 skills/memory-bridge/scripts/session-to-memory.py --agent-id main --update-memory-md

# Review and update MEMORY.md manually if needed
```

### Monthly Cleanup

1. **Review MEMORY.md**
   - Are there outdated projects?
   - Have preferences changed?
   - Are decisions still relevant?

2. **Archive old daily files** (optional)
   - Daily files older than 90 days can be archived
   - Compress to `memory/archive/2026-Q1.zip`

3. **Update categories**
   - Reorganize sections if they've grown
   - Split large sections into subsections

## Integration with Agent Behavior

### On Session Start

Agents should:
1. Read `memory/YYYY-MM-DD.md` (today + yesterday)
2. Read `MEMORY.md` for long-term context (main session only)
3. Acknowledge recent context briefly if relevant

### During Sessions

Agents should:
1. Note important decisions, facts, preferences
2. Capture todos and action items
3. Learn from mistakes and errors

### On Session End

Memory-bridge should:
1. Process the session file
2. Extract categorized content
3. Append to daily memory file
4. Flag important items for MEMORY.md

## Tips for Effective Memory

### Do's

- **Be specific** - "API rate limit: 1000/hour" not "API has limits"
- **Include context** - Why was a decision made?
- **Use consistent terms** - Pick "database" or "DB", not both
- **Link related items** - Reference previous decisions

### Don'ts

- **Don't log everything** - Summaries, not transcripts
- **Don't duplicate** - Update MEMORY.md, don't copy daily files
- **Don't include secrets** - API keys, passwords
- **Don't let it grow forever** - Review and prune regularly

## Example Workflow

```
Session happens → Agent takes notes → Session ends
       ↓
Memory Bridge script runs (cron or manual)
       ↓
Reads ~/.openclaw/agents/main/sessions/*.jsonl
       ↓
Extracts: decisions, facts, preferences, todos
       ↓
Writes to: memory/2026-02-03.md
       ↓
Updates: MEMORY.md (important items only)
       ↓
Next session: Agent reads memory files for context
```

## Troubleshooting

### Daily files too large?

- Increase extraction selectivity in session-to-memory.py
- Archive old files monthly
- Summarize multiple sessions in one entry

### MEMORY.md getting cluttered?

- Create sections by project or topic
- Move outdated items to an "Archive" section
- Delete items no longer relevant

### Missing important context?

- Review extraction patterns in the script
- Add custom patterns for your domain
- Manually add critical items to MEMORY.md
