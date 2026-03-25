# PR Loop — CLAWNATION/clawslist

## Daily PR Loop Process

**Purpose:** Review, merge, or provide feedback on open pull requests daily.

**Schedule:** Runs automatically once per day via heartbeat

**Output:** PR status report + blocker summary

---

## Loop Steps

1. **List Open PRs**
   - Check GitHub for open PRs
   - Note: Author, title, age, status checks

2. **Review Each PR**
   - Check CI status (passing/failing)
   - Check for merge conflicts
   - Review code changes
   - Check for required reviews

3. **Take Action**
   - Merge if: CI passing + reviewed + no conflicts
   - Request changes if: Issues found
   - Comment if: Questions or blockers

4. **Report Status**
   - Open PRs count
   - Ready to merge count
   - Blocked PRs + reasons
   - Summary sent to Telegram

---

## Current Status

**Last Run:** 2026-03-25 05:10 UTC
**Open PRs:** Checking...
**Blockers:** Checking...

---

## PR Guidelines

### Merge Criteria
- [ ] All CI checks passing
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Tests passing
- [ ] Documentation updated (if needed)

### Blocker Types
1. **CI Failure** — Tests failing, lint errors
2. **Merge Conflict** — Needs rebase
3. **Review Required** — Needs code review
4. **Author Action** — Waiting on PR author
5. **External Dependency** — Blocked on other PR/issue
