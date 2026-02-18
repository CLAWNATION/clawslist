# Clawslist — 7-Agent Dev Team Architecture

**Goal:** Parallel development with zero merge conflicts  
**Strategy:** Feature-based partitioning with strict API contracts  
**Date:** 2026-02-12

---

## ARCHITECTURE PRINCIPLE

**NO shared files. NO overlapping code. Clean API boundaries.**

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCT MANAGER AGENT                        │
│              (Coordinates, defines APIs, integrates)             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│     AUTH      │    │   LISTINGS    │    │    SEARCH     │
│    SERVICE    │    │   SERVICE     │    │   SERVICE     │
│    AGENT      │    │    AGENT      │    │    AGENT      │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
   auth/ directory      listings/ directory   search/ directory
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │ Routes  │          │ Routes  │          │ Routes  │
   │ Models  │          │ Models  │          │ Models  │
   │ Logic   │          │ Logic   │          │ Logic   │
   └─────────┘          └─────────┘          └─────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PAYMENTS &   │    │  MESSAGING &  │    │    MEDIA &    │
│    ESCROW     │    │ NOTIFICATIONS │    │    STORAGE    │
│    SERVICE    │    │    SERVICE    │    │    SERVICE    │
│    AGENT      │    │    AGENT      │    │    AGENT      │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
  payments/ directory   messages/ directory  media/ directory
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │ Routes  │          │ Routes  │          │ Routes  │
   │ Models  │          │ Models  │          │ Models  │
   │ Logic   │          │ Logic   │          │ Logic   │
   └─────────┘          └─────────┘          └─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  FRONTEND SHELL   │
                    │    AGENT (7th)    │
                    └───────────────────┘
                         client/
                              │
                    ┌─────────┴─────────┐
                    │   Page Components  │
                    │   API Integration  │
                    │   State Management │
                    └───────────────────┘
```

---

## THE 7 DEV AGENTS

### AGENT 1: AUTH & IDENTITY SERVICE

**Scope:** Authentication, X verification, profiles, permissions

**Directory:** `server/src/services/auth/`  
**Files Owned:**
```
server/src/services/auth/
├── routes.js          # Auth endpoints
├── controller.js      # Business logic
├── models.js          # DB schema/queries
├── xVerification.js   # X API integration
├── middleware.js      # JWT validation
└── tests/
    └── auth.test.js
```

**API Contract (what others can use):**
```javascript
// Other agents import this:
const { requireAuth, getCurrentUser } = require('../auth/middleware');

// Usage in their routes:
router.post('/posts', requireAuth, ...);
```

**Database Tables Owned:**
- `profiles`
- `verification_codes` 
- `auth_sessions`

**NO TOUCH:** Other services' tables, frontend code

---

### AGENT 2: LISTINGS SERVICE

**Scope:** CRUD for posts, reference codes, categories, inquiry threads

**Directory:** `server/src/services/listings/`  
**Files Owned:**
```
server/src/services/listings/
├── routes.js          # /posts/* endpoints
├── controller.js      # Post logic
├── models.js          # Post DB queries
├── referenceCodes.js  # Code generation
├── categories.js      # Category definitions
├── validation.js      # Post schemas
└── tests/
    └── listings.test.js
```

**API Contract:**
```javascript
// Other agents can call:
const listings = require('../listings/models');
const post = await listings.getById(id);
const refCode = await listings.generateRefCode(category, location);
```

**Database Tables Owned:**
- `posts`
- `post_images`
- `categories`

**External Dependencies:** Calls Auth service for `requireAuth`

---

### AGENT 3: SEARCH & DISCOVERY SERVICE

**Scope:** Search, filtering, recommendations, indexing

**Directory:** `server/src/services/search/`  
**Files Owned:**
```
server/src/services/search/
├── routes.js          # /search, /discover
├── controller.js      # Search logic
├── index.js           # Indexing engine
├── filters.js         # Filter processing
├── elasticsearch.js   # ES client (future)
└── tests/
    └── search.test.js
```

**API Contract:**
```javascript
// Other agents use search to find posts:
const search = require('../search/index');
const results = await search.findPosts({ category, location, price });
```

**Database Tables Owned:**
- `search_index` (if needed)
- `recommendations_cache`

**Reads From:** Listings service (posts table)  
**NO WRITES to:** posts table

---

### AGENT 4: PAYMENTS & ESCROW SERVICE

**Scope:** Wallets, escrow, USDC, transaction history

**Directory:** `server/src/services/payments/`  
**Files Owned:**
```
server/src/services/payments/
├── routes.js          # /escrow, /wallets
├── controller.js      # Payment logic
├── models.js          # Escrow queries
├── wallet.js          # Wallet connection
├── escrowContract.js  # Smart contract calls
├── stripeMock.js      # Payment processing
└── tests/
    └── payments.test.js
```

**API Contract:**
```javascript
// Other agents call for payments:
const payments = require('../payments/models');
const escrow = await payments.createEscrow({ postId, amount, buyer, seller });
await payments.releaseFunds(escrowId);
```

**Database Tables Owned:**
- `escrows`
- `wallets`
- `transactions`
- `payouts`

**External Dependencies:** Listings service (to get post info)

---

### AGENT 5: MESSAGING & NOTIFICATIONS SERVICE

**Scope:** Comments, inquiries, real-time chat, push notifications

**Directory:** `server/src/services/messaging/`  
**Files Owned:**
```
server/src/services/messaging/
├── routes.js          # /comments, /inquiries, /messages
├── controller.js      # Message logic
├── models.js          # Message queries
├── realtime.js        # WebSocket/Supabase realtime
├── notifications.js   # Push notification service
├── email.js           # Email templates
└── tests/
    └── messaging.test.js
```

**API Contract:**
```javascript
// Other agents send notifications:
const messaging = require('../messaging/notifications');
await messaging.sendToUser(userId, { title, body, data });
await messaging.postComment(postId, userId, content);
```

**Database Tables Owned:**
- `comments`
- `messages`
- `conversations`
- `notifications`
- `push_tokens`

**External Dependencies:** Auth service (user lookup), Listings (post lookup)

---

### AGENT 6: MEDIA & STORAGE SERVICE

**Scope:** Image uploads, file storage, CDN, image processing

**Directory:** `server/src/services/media/`  
**Files Owned:**
```
server/src/services/media/
├── routes.js          # /upload/*
├── controller.js      # Upload logic
├── storage.js         # Supabase S3 client
├── imageProcessor.js  # Resize, optimize
├── cdn.js             # CDN URL generation
└── tests/
    └── media.test.js
```

**API Contract:**
```javascript
// Other agents handle media:
const media = require('../services/media/storage');
const { url, path } = await media.uploadImage(file, userId);
const optimizedUrl = await media.optimizeImage(url, { width: 800 });
```

**Database Tables Owned:**
- `media_assets`
- `upload_sessions`

**Storage Buckets Owned:**
- `post-images`
- `user-avatars`

---

### AGENT 7: FRONTEND SHELL AGENT

**Scope:** React app, routing, state management, UI components

**Directory:** `client/src/`  
**Files Owned (organized by feature):**
```
client/src/
├── features/           # Feature-based organization
│   ├── auth/          # Auth Agent owns this
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── useAuth.js
│   ├── listings/      # Listings Agent owns this
│   │   ├── CreatePost.jsx
│   │   ├── PostList.jsx
│   │   ├── PostDetail.jsx
│   │   └── useListings.js
│   ├── search/        # Search Agent owns this
│   │   ├── SearchBar.jsx
│   │   ├── Filters.jsx
│   │   └── useSearch.js
│   ├── payments/      # Payments Agent owns this
│   │   ├── Escrow.jsx
│   │   ├── Wallet.jsx
│   │   └── usePayments.js
│   ├── messaging/     # Messaging Agent owns this
│   │   ├── Comments.jsx
│   │   ├── Inbox.jsx
│   │   └── useMessages.js
│   └── media/         # Media Agent owns this
│       ├── ImageUpload.jsx
│       ├── Gallery.jsx
│       └── useMedia.js
├── components/        # Shared UI (7th Agent owns)
│   ├── Button.jsx
│   ├── Input.jsx
│   └── Layout.jsx
├── lib/              # API clients (7th Agent owns wrappers)
│   ├── api.js        # Centralized API client
│   └── supabase.js
└── App.jsx           # 7th Agent owns routing
```

**Integration Pattern:**
- 7th Agent creates API client wrappers
- Other agents' frontend code lives in their feature folders
- 7th Agent integrates all features into main app

---

## ANTI-MERGE-CONFLICT STRATEGY

### 1. NO Shared Files

Each agent ONLY touches files in their directory:

```javascript
// GOOD: Auth Agent
code
server/src/services/auth/routes.js  // ✅ They own this
server/src/services/auth/controller.js  // ✅ They own this

// BAD: Auth Agent touching Listings
server/src/services/listings/routes.js  // ❌ DON'T TOUCH
```

### 2. Communication Via APIs Only

```javascript
// Auth Agent exposes:
exports.requireAuth = (req, res, next) => { ... };
exports.getUser = (userId) => { ... };

// Listings Agent imports and uses:
const { requireAuth } = require('../auth/routes');
router.post('/posts', requireAuth, createPost);
```

### 3. Database Isolation

Each agent owns their tables:

| Agent | Owns These Tables | Can Read | Cannot Touch |
|-------|------------------|----------|--------------|
| Auth | profiles, verification_codes | - | posts, escrows |
| Listings | posts, categories | profiles | wallets, comments |
| Search | search_index | posts | posts (write) |
| Payments | escrows, wallets | posts | profiles, posts |
| Messaging | comments, messages | posts, profiles | escrows, wallets |
| Media | media_assets | - | posts (except image_url) |

### 4. Frontend Feature Folders

Each service agent has a corresponding frontend folder:

```
client/src/features/
├── auth/          ← Auth Agent
├── listings/      ← Listings Agent
├── search/        ← Search Agent
├── payments/      ← Payments Agent
├── messaging/     ← Messaging Agent
└── media/         ← Media Agent
```

Frontend Shell Agent (7th) owns the integration:
```jsx
// client/src/App.jsx (Shell Agent owns this)
import { AuthProvider } from './features/auth/useAuth';
import { ListingsProvider } from './features/listings/useListings';

function App() {
  return (
    <AuthProvider>
      <ListingsProvider>
        {/* Routes for all features */}
      </ListingsProvider>
    </AuthProvider>
  );
}
```

---

## API CONTRACT DOCUMENTATION

Product Manager Agent maintains `API_CONTRACTS.md`:

```markdown
## Auth Service API

### Exports
- `requireAuth(req, res, next)` — Express middleware
- `getUser(userId)` → Promise<User>
- `validateToken(token)` → Promise<Payload>

### Version: v1.0
### Owner: Auth Agent
### Last Updated: 2026-02-12

---

## Listings Service API

### Exports
- `createPost(data, userId)` → Promise<Post>
- `getPostById(id)` → Promise<Post>
- `getPostByRefCode(code)` → Promise<Post>
- `generateRefCode(category, location)` → Promise<string>

### Version: v1.0
### Owner: Listings Agent
### Last Updated: 2026-02-12
```

---

## DEVELOPMENT WORKFLOW

### Sprint Start

```
Product Manager:
1. Creates 7 tickets (one per agent)
2. Defines API contracts
3. Updates shared documentation

Each Agent:
1. Pulls latest main
2. Creates feature branch: feature/agent-name/task
3. Works ONLY in their directory
```

### During Sprint

```
Agent needs data from another service?
→ Call their API (import from their models.js)
→ NEVER touch their files

Agent needs DB schema change?
→ Request via Product Manager
→ PM coordinates migration

Agent needs frontend component?
→ Build in their features/ folder
→ Shell Agent integrates
```

### PR Review

```
Auth Agent PR:
Files changed:
- server/src/services/auth/routes.js ✅
- server/src/services/auth/controller.js ✅
- server/src/services/auth/tests/auth.test.js ✅

NO files outside auth/ ✅
APPROVED by Product Manager
```

### Integration

```
Shell Agent PR (end of sprint):
Files changed:
- client/src/App.jsx (integrates all features)
- client/src/lib/api.js (centralized API)
- client/src/components/* (shared UI)

APPROVED by all service agents + Product Manager
```

---

## PARALLEL DEVELOPMENT EXAMPLE

### Feature: "Add X API Verification"

**Product Manager:**
```
Ticket 1 (Auth Agent): Integrate X API
Ticket 2 (Listings Agent): No work (use existing APIs)
Ticket 3 (Shell Agent): Update auth UI for X verification
```

**Auth Agent Branch:** `feature/auth/x-api-integration`
```javascript
// server/src/services/auth/xVerification.js (NEW FILE)
const { TwitterApi } = require('twitter-api-v2');

async function verifyXPost(url, code) {
  // X API integration
}

module.exports = { verifyXPost };
```

**Shell Agent Branch:** `feature/shell/x-verification-ui`
```jsx
// client/src/features/auth/XVerification.jsx (NEW FILE)
import { useAuth } from './useAuth';

export function XVerification() {
  // UI for X verification
}
```

**NO MERGE CONFLICTS because:**
- Auth Agent only touches `auth/` files
- Shell Agent only touches `features/auth/` UI files
- They communicate via API contract, not shared files

---

## SPAWN COMMANDS

```bash
# 1. Auth & Identity Agent
openclaw agent spawn \
  --name clawslist-auth-agent \
  --scope "server/src/services/auth/,client/src/features/auth/" \
  --contract-auth \
  --owns-tables "profiles,verification_codes"

# 2. Listings Agent  
openclaw agent spawn \
  --name clawslist-listings-agent \
  --scope "server/src/services/listings/,client/src/features/listings/" \
  --contract-listings \
  --owns-tables "posts,categories"

# 3. Search Agent
openclaw agent spawn \
  --name clawslist-search-agent \
  --scope "server/src/services/search/,client/src/features/search/" \
  --contract-search \
  --owns-tables "search_index"

# 4. Payments Agent
openclaw agent spawn \
  --name clawslist-payments-agent \
  --scope "server/src/services/payments/,client/src/features/payments/" \
  --contract-payments \
  --owns-tables "escrows,wallets,transactions"

# 5. Messaging Agent
openclaw agent spawn \
  --name clawslist-messaging-agent \
  --scope "server/src/services/messaging/,client/src/features/messaging/" \
  --contract-messaging \
  --owns-tables "comments,messages,notifications"

# 6. Media Agent
openclaw agent spawn \
  --name clawslist-media-agent \
  --scope "server/src/services/media/,client/src/features/media/" \
  --contract-media \
  --owns-tables "media_assets" \
  --owns-buckets "post-images,user-avatars"

# 7. Frontend Shell Agent
openclaw agent spawn \
  --name clawslist-shell-agent \
  --scope "client/src/App.jsx,client/src/components/,client/src/lib/,client/src/features/*/index.js" \
  --role integrator \
  --reviews-all-frontend
```

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Merge conflicts per sprint | 0 |
| Parallel feature development | 7 simultaneous |
| Integration time | <2 hours at sprint end |
| API contract violations | 0 |
| Cross-agent file touches | 0 |

---

## READY TO SPAWN 7 DEV AGENTS

**Product Director (You):** Approve this architecture  
**Product Manager Agent:** Will coordinate sprints, define APIs  
**7 Dev Agents:** Will work in parallel with zero conflicts

**First Sprint:**
- Auth Agent: X API integration
- Listings Agent: Reference code improvements
- Search Agent: Elasticsearch setup
- Payments Agent: Smart contract integration
- Messaging Agent: Real-time chat
- Media Agent: Image optimization
- Shell Agent: Dashboard UI

**ETA to production:** 1 week (vs 7 weeks sequential)

