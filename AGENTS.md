> **AGENT PARTITION CONFIGURATION**
> 
> This file defines isolated agent contexts for parallel development.
> Each agent has restricted scope, tools, and permissions.

---

## 🎯 COORDINATION AGENT (You)

**Role:** Orchestrator  
**Responsibility:** Task assignment, review, merge, deploy  
**Scope:** All partitions  
**Session:** This conversation

---

## AGENT 1: INFRASTRUCTURE AGENT

```yaml
name: clawslist-infra
role: Platform Engineer
scope:
  - Database schema
  - Supabase configuration
  - Storage buckets
  - Environment variables
  - CI/CD pipelines
tools:
  - supabase CLI
  - railway CLI
  - git
permissions:
  - supabase: admin
  - railway: production
  - github: write
restrictions:
  - NO application code changes
  - NO API logic modifications
```

**Current Task:** Production database setup  
**Status:** 🟡 Pending

---

## AGENT 2: BACKEND AGENT

```yaml
name: clawslist-backend
role: Backend Engineer
scope:
  - API endpoints
  - Service layer
  - Authentication
  - Database queries
  - Validation schemas
tools:
  - Node.js
  - Express
  - Zod
  - Supabase client
permissions:
  - server/src: write
  - tests/backend: write
restrictions:
  - NO frontend code
  - NO infrastructure changes
  - MUST write tests
```

**Current Task:** X API integration  
**Status:** 🔴 Blocked (waiting for X_API_KEY)

---

## AGENT 3: FRONTEND AGENT

```yaml
name: clawslist-frontend
role: Frontend Engineer
scope:
  - React components
  - API integration
  - UI/UX
  - Client-side validation
  - Mobile responsive
tools:
  - React
  - TypeScript
  - Tailwind
  - Vite
permissions:
  - client/src: write
  - public/: write
restrictions:
  - NO backend code
  - NO database changes
  - MUST match design system
```

**Current Task:** Listing detail page  
**Status:** 🟡 Ready to start

---

## AGENT 4: QA/TEST AGENT

```yaml
name: clawslist-qa
role: Quality Engineer
scope:
  - Unit tests
  - Integration tests
  - E2E tests
  - Load testing
  - Security audits
tools:
  - Jest
  - Cypress
  - Playwright
  - k6
permissions:
  - tests/: write
  - Read-only on src/
restrictions:
  - NO production code
  - NO deployment access
  - MUST report bugs with repro steps
```

**Current Task:** Write test suite for escrow flow  
**Status:** 🟢 Active

---

## PARALLEL WORKFLOW EXAMPLE

### Scenario: "Add X API Verification"

**T+0: Coordination Agent assigns tasks**

```
→ Infra Agent: Add X_API_KEY env var
→ Backend Agent: Create X verification service
→ Frontend Agent: Update UI for X auth flow
→ QA Agent: Write tests for X verification
```

**T+5min: Parallel execution**

| Agent | Task | Status |
|-------|------|--------|
| Infra | `railway variables set X_API_KEY=xxx` | ✅ Done |
| Backend | `services/xApi.js` — API client | 🔄 In progress |
| Frontend | `components/XAuthButton.jsx` | 🔄 In progress |
| QA | `tests/xVerification.test.js` | 🔄 In progress |

**T+15min: Review & merge**

```
Coordination Agent:
  1. Reviews Infra Agent's env var setup ✅
  2. Reviews Backend Agent's service code ✅
  3. Reviews Frontend Agent's component ✅
  4. Reviews QA Agent's tests ✅
  5. Runs integration tests ✅
  6. Merges to main ✅
  7. Deploys to production ✅
```

**T+20min: Production live**

---

## SPAWN COMMANDS

Use these to invoke partitioned agents:

```bash
# Spawn Infrastructure Agent
openclaw agent spawn \
  --name clawslist-infra \
  --task "Set up production database and env vars" \
  --scope infra/

# Spawn Backend Agent  
openclaw agent spawn \
  --name clawslist-backend \
  --task "Integrate X API for verification" \
  --scope server/src/ \
  --env X_API_KEY=$KEY

# Spawn Frontend Agent
openclaw agent spawn \
  --name clawslist-frontend \
  --task "Build listing detail page" \
  --scope client/src/

# Spawn QA Agent
openclaw agent spawn \
  --name clawslist-qa \
  --task "Write E2E tests for escrow flow" \
  --scope tests/ \
  --mode read-only
```

---

## ISOLATION GUARANTEES

1. **File System:** Each agent has chroot to its scope
2. **Network:** Agents cannot access each other's APIs
3. **Database:** Separate schemas or RLS policies
4. **Secrets:** Only Infra Agent sees prod credentials
5. **Git:** Agents commit to feature branches, not main

---

## COMMUNICATION PROTOCOL

Agents communicate only through:
1. **Git commits** — code changes
2. **Pull requests** — review requests
3. **Issue comments** — async discussion
4. **Coordination Agent** — sync decisions

**NO direct agent-to-agent messaging.**

This prevents:
- State corruption
- Conflicting changes
- Secret leakage
- Unauthorized access

---

## CURRENT STATUS

| Agent | Task | ETA | Status |
|-------|------|-----|--------|
| Infra | Prod DB setup | 5min | 🟡 Ready |
| Backend | X API integration | 30min | 🔴 Blocked |
| Frontend | Listing detail UI | 45min | 🟡 Ready |
| QA | Escrow E2E tests | 60min | 🟢 Active |

**Next Action:** Get X_API_KEY → Unblock Backend Agent

