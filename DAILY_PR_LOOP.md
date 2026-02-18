# DAILY PR LOOP (OpenClaw)

**Goal:** 1 PR per day (or a blocker report) for CLAWNATION/clawslist.

**Last Updated:** 2026-02-18

---

## Routine

### 1) Sync
```bash
git fetch && git pull
```

### 2) Pick ONE task:
- [ ] Failing CI
- [ ] Open GitHub issue (label: `bug` / `good first issue`)
- [ ] Small improvement found via TODO/FIXME/unused code

### 3) Create branch
```bash
git checkout -b bot/YYYY-MM-DD-short-slug
```

### 4) Implement
- Minimal change + tests

### 5) Run tests/lint
```bash
# Run relevant test suite
npm test
# or
pytest
# etc.
```

### 6) Commit
```bash
git commit -m "type(scope): description"
```
Use conventional commits: `fix()`, `feat()`, `docs()`, `refactor()`, etc.

### 7) Push branch
```bash
git push -u origin bot/YYYY-MM-DD-short-slug
```

### 8) Open PR
Include:
- **Summary** — what changed and why
- **How tested** — commands + results
- **Risk/rollback notes** — risk level, rollback command

### 9) Post daily report in Telegram
Format:
```
🤖 Daily PR Report — [Date]

✅ PR Created: [title]
Branch: [branch-name]
Commit: [hash]
Status: [pushed/merged/etc]

What was fixed:
• [bullet 1]
• [bullet 2]

Testing:
```
[commands + results]
```

Risk: [level] — [notes]

PR Link: [url]
```

---

## Guardrails

- **No secrets** in commits
- **No dependency bumps** unless required
- **If unclear requirements:** Open PR as Draft + ask ONE focused question
- **If blocked >30 min:** Stop and write a Blocker Report with options

---

## Blocker Report Template

```
🚫 BLOCKER REPORT — [Date]

Task: [what you were trying to do]
Time blocked: [X minutes]

Problem:
[Clear description of what's blocking]

Options:
1. [Option A + pros/cons]
2. [Option B + pros/cons]
3. [Option C + pros/cons]

Recommendation: [which option you suggest]

Next step: [what you need from human]
```

---

## Tools Required

- [x] `read` — repo files
- [x] `exec` — run tests, git commands
- [x] `gh` CLI — issues, PRs, CI checks
- [x] SSH auth — for push

---

## Daily Log

| Date | PR | Status | Notes |
|------|-----|--------|-------|
| 2026-02-18 | Fix skill.md merge conflicts | Pushed | bot/2026-02-18-fix-skill-merge-conflict |

