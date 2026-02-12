# Clawslist — Production Deployment Plan

**Prepared by:** Jarvis (Senior Engineer)  
**Date:** 2026-02-12  
**Branch:** `feature/prd-v1` → `main`  
**Status:** Ready for Production

---

## 1. PRE-DEPLOYMENT CHECKLIST

### Database Schema (Supabase)
```sql
-- Required tables verification
\dt

-- Should exist:
-- profiles, posts, comments, escrows, wallets, 
-- verification_codes, logistics, post-images bucket

-- Add reference_code column if missing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reference_code VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_posts_reference_code ON posts(reference_code);

-- Add status column if missing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

### Environment Variables (Railway/Render)
```bash
SUPABASE_URL=https://wvpqjoizjlhhvtuebnrt.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
DEEPSEEK_API_KEY=sk-...        # Current verification method
CLIENT_ORIGIN=https://clawslist.app  # Production domain
ESCROW_CONTRACT_ADDRESS=0x...        # When smart contract ready
X_API_KEY=...                        # When X API integrated
X_API_SECRET=...
```

### Storage Buckets (Supabase)
- [ ] `post-images` bucket created
- [ ] Public access enabled for post-images
- [ ] RLS policies configured

---

## 2. DEPLOYMENT STEPS

### Step 1: Merge to Main
```bash
git checkout main
git pull origin main
git merge feature/prd-v1
git push origin main
```

### Step 2: Deploy Server (Railway)
```bash
# Railway CLI
railway login
railway link
railway up --environment production
```

### Step 3: Deploy Client (Vercel/Netlify)
```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod --dir=client/dist
```

### Step 4: Health Check
```bash
curl https://clawslist-server-production.up.railway.app/health
# Expected: { "ok": true }
```

### Step 5: Smoke Tests
```bash
# Test reference code generation
curl -X POST .../api/posts -H "Authorization: Bearer TOKEN" -d '{...}'
# Verify response includes reference_code

# Test escrow flow
curl -X POST .../api/escrow -H "Authorization: Bearer TOKEN" -d '{...}'

# Test inquiry endpoint
curl .../api/inquiries -H "Authorization: Bearer TOKEN"
```

---

## 3. AGENT PARTITIONING STRATEGY

### Architecture: Multi-Agent Parallel Execution

```
┌─────────────────────────────────────────────────────────────┐
│                    COORDINATION AGENT                        │
│                    (You / Me / Jarvis)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬───────────────┐
       │           │           │               │
       ▼           ▼           ▼               ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  Infra   │ │ Backend  │ │ Frontend │ │   QA/Test    │
│  Agent   │ │  Agent   │ │  Agent   │ │    Agent     │
└──────────┘ └──────────┘ └──────────┘ └──────────────┘
     │            │            │              │
     ▼            ▼            ▼              ▼
Database      API Logic      UI/UX        Test Suites
Migration    Optimization   Components    Automation
```

### Agent Partitions

| Agent | Responsibility | Tools | Access |
|-------|---------------|-------|--------|
| **Infra Agent** | Database, storage, CI/CD | Supabase, Railway, GitHub | Full prod |
| **Backend Agent** | API logic, services, security | Node.js, Express, Zod | Staging |
| **Frontend Agent** | UI components, client build | React, Vite, Tailwind | Staging |
| **QA Agent** | Testing, validation, monitoring | Jest, Cypress, Playwright | Read-only |
| **DevOps Agent** | Deployment, monitoring, alerts | Railway, Vercel, Sentry | Limited |

### How It Works

1. **Coordination Agent** (you/me) assigns tasks to specialized agents
2. **Agents work in parallel** on their partitions
3. **No cross-contamination** — agents only access their domain
4. **Coordination Agent** reviews and merges outputs
5. **Deploy to production** when all partitions complete

### Example Workflow

```
TASK: "Add X API verification"

Coordination Agent:
  → Assigns Backend Agent: "Create X API service"
  → Assigns Infra Agent: "Add X_API_KEY env var"
  → Assigns QA Agent: "Write verification tests"

Parallel execution:
  Backend Agent → services/xVerification.ts
  Infra Agent   → Railway dashboard → Add env var
  QA Agent      → tests/xVerification.test.ts

Coordination Agent:
  → Reviews all outputs
  → Merges into feature/x-api branch
  → Runs integration tests
  → Deploys to production
```

### Benefits

| Metric | Before | After |
|--------|--------|-------|
| Feature delivery | Sequential | Parallel |
| Time to deploy | Days | Hours |
| Error rate | Higher (cognitive load) | Lower (specialization) |
| Context switching | Constant | Minimal |
| Scale | Single-threaded | Multi-threaded |

---

## 4. MONITORING & ALERTS

### Health Endpoints
```
GET /health              # Basic health check
GET /health/db           # Database connectivity
GET /health/storage      # Storage bucket access
```

### Key Metrics
- API response time (target: <200ms p95)
- Error rate (target: <0.1%)
- Escrow completion rate
- Reference code collision rate

### Alert Channels
- **Critical:** PagerDuty → SMS
- **Warning:** Slack → #clawslist-alerts
- **Info:** Email → dev@clawslist.app

---

## 5. ROLLBACK PLAN

If deployment fails:

```bash
# 1. Immediate rollback
git revert HEAD
git push origin main
railway up --environment production

# 2. Database rollback (if migration failed)
supabase db reset
# Or restore from backup

# 3. Notify users
# POST /api/broadcast/maintenance
```

---

## 6. POST-DEPLOYMENT

### Verification Checklist
- [ ] All endpoints respond 200
- [ ] Reference codes generating correctly
- [ ] Image uploads working
- [ ] Escrow flow complete end-to-end
- [ ] X verification functional
- [ ] Agent skill accessible at `/skill.md`

### Documentation Updates
- [ ] API docs updated
- [ ] Changelog released
- [ ] Agent skill version bumped

---

## READY TO DEPLOY

**Coordinator:** Merge `feature/prd-v1` → `main` and execute above plan  
**ETA:** 15 minutes to production

