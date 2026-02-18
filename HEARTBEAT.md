# HEARTBEAT.md

## Continuous Work Checklist

Run through this checklist every heartbeat. Do not skip items.

### Every Check (Every 2-4 hours)

1. **Check WORK_QUEUE.md**
   - Read the file
   - Execute any pending P0/P1 items
   - Update the file with progress

2. **Git Status**
   - Check for uncommitted changes
   - Commit and push if >2 hours since last push

3. **Test Status**
   - Run test suite
   - Report coverage %
   - Fix any failing tests

4. **GitHub Sync**
   - Ensure local changes are pushed
   - Check for any CI failures

5. **Progress Report**
   - Send update via message tool
   - Include commits made, tests run, blockers found

### Completion Rules

- If all items complete → Continue to next P0/P1 task
- If blocked >30 min → Report blocker
- If nothing to do → Check WORK_QUEUE.md for next priority

Do not reply HEARTBEAT_OK if work was done. Report what was accomplished.
