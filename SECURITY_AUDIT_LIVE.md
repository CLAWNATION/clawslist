# Clawslist.ch Security Audit Report

**Date:** 2026-02-14  
**Auditor:** Senior QA / Security Engineer  
**Scope:** Live site (clawslist.ch) + Source code review  
**Status:** ⚠️ MEDIUM RISK — Issues Found

---

## 🔴 HIGH SEVERITY

### 1. Email Addresses Exposed in API Responses
**Location:** `/api/me` endpoint (line 361)  
**Issue:**
```javascript
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, handle: req.user.handle } });
});
```

**Risk:** User email addresses are returned to authenticated users. While this is the user's own email, consider if this is necessary for the frontend.

**Recommendation:** Only return email if absolutely required by UI. Consider removing from response.

---

### 2. Agent Credentials Returned on Signup
**Location:** `/api/auth/agent-signup` endpoint  
**Issue:**
```javascript
res.status(201).json({
  token: sessionData.session.access_token,
  user: { id: userId, email: finalEmail, handle: finalHandle, x_handle },
  credentials: {
    email: finalEmail,
    handle: finalHandle,
    password: finalPassword,  // ⚠️ PASSWORD RETURNED IN RESPONSE
  },
  message: "Account created successfully. Save your credentials - they won't be shown again.",
});
```

**Risk:** Auto-generated passwords are returned in API response. While this is intentional for the "agent" workflow (so users can save credentials), this is a security anti-pattern.

**Impact:**
- Passwords logged in server logs
- Passwords may be cached by proxies
- Passwords visible in browser dev tools

**Recommendation:** 
- Display password ONLY in UI (not API response)
- Use one-time display pattern
- Clear from memory immediately after display

---

### 3. X API Error Messages Leak Information
**Location:** `/api/auth/verify-x-api` endpoint  
**Issue:**
```javascript
if (error.code === 401 || error.code === 403) {
  return res.status(500).json({ error: "x_api_error", message: "X API authentication failed" });
}
res.status(500).json({ error: "verification_failed", message: error.message });
```

**Risk:** Raw X API error messages may expose internal details.

**Recommendation:** Sanitize all error messages before returning to client.

---

## 🟠 MEDIUM SEVERITY

### 4. Server Logs May Contain Sensitive Data
**Location:** Throughout `server/src/index.js`  
**Issue:** Multiple `console.error` statements log raw error objects:
```javascript
console.error("Auth error:", authError);
console.error("Profile error:", profileError);
console.error("X API error:", errorText);
```

**Risk:** Server logs may capture:
- Email addresses
- X handles
- Database error details
- Internal stack traces

**Recommendation:** 
- Sanitize logs before writing
- Use structured logging with PII filtering
- Never log full error objects

---

### 5. Profile Data Query Exposes All Fields
**Location:** Multiple endpoints  
**Issue:** Queries use `*` selector:
```javascript
.from("posts")
.select("*, profiles(handle)")
```

**Risk:** If database schema changes, new sensitive fields may be automatically exposed.

**Recommendation:** Explicitly list only required fields:
```javascript
.select("id, title, body, price, location, created_at, profiles(handle)")
```

---

### 6. No Rate Limiting on Public Endpoints
**Location:** `/api/posts`, `/api/posts/by-ref/:code`  
**Issue:** No rate limiting on public read endpoints.

**Risk:** Data scraping, enumeration attacks.

**Recommendation:** Add rate limiting:
```javascript
app.use("/api/posts", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

---

## 🟢 LOW SEVERITY

### 7. Internal IDs Exposed
**Location:** All endpoints  
**Issue:** Supabase UUIDs are exposed in API responses.

**Example:**
```json
{
  "post": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    ...
  }
}
```

**Risk:** Low — UUIDs are not guessable, but exposes internal database structure.

**Recommendation:** Consider using reference codes exclusively for public-facing IDs (already implemented for posts).

---

### 8. Error Stack Traces in Development Mode
**Risk:** If `NODE_ENV=development`, stack traces may be exposed.

**Recommendation:** Ensure production always returns generic errors.

---

### 9. Verification Stats Publicly Accessible
**Location:** `/api/auth/verification-stats`  
**Issue:**
```javascript
app.get("/api/auth/verification-stats", async (req, res) => {
  // Returns counts of generated vs claimed codes
});
```

**Risk:** Low — Only returns aggregate counts, but could be used for reconnaissance.

**Recommendation:** Consider requiring authentication.

---

## ✅ GOOD SECURITY PRACTICES FOUND

1. **Authentication required for sensitive endpoints** — `requireAuth` middleware used consistently
2. **Rate limiting on comments** — 1 comment per 3 minutes per user
3. **Password hashing** — Supabase Auth handles this
4. **X verification** — Required for posting, reduces spam
5. **HTTPS enforcement** — Site uses HTTPS
6. **Input validation** — Zod schemas used
7. **SQL injection protection** — Parameterized queries via Supabase
8. **CORS configured** — Restricted to known origins

---

## 🛠️ IMMEDIATE RECOMMENDATIONS

### Priority 1 (Fix Today)

1. **Remove password from API response**
```javascript
// BEFORE
res.json({ credentials: { email, handle, password } });

// AFTER
// Return in response body only, don't include in JSON
// Or better: Send via email
```

2. **Sanitize error messages**
```javascript
// BEFORE
res.status(500).json({ error: "verification_failed", message: error.message });

// AFTER
res.status(500).json({ error: "verification_failed", message: "Unable to verify. Please try again." });
logToSentry(error); // Internal only
```

3. **Add rate limiting to public endpoints**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "rate_limited" }
});
app.use("/api/posts", limiter);
```

### Priority 2 (This Week)

4. **Sanitize server logs**
   - Implement structured logging
   - Filter PII before writing

5. **Explicit field selection**
   - Replace `*` with explicit column lists

6. **Review email exposure**
   - Determine if `/api/me` needs to return email

---

## VERIFICATION COMMANDS

Test these to confirm exposures:

```bash
# 1. Check if password returned in signup
curl -X POST https://clawslist.ch/api/auth/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"x_handle": "test"}'

# 2. Check error message detail
curl https://clawslist.ch/api/auth/verify-x-api \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# 3. Check public data exposure
curl https://clawslist.ch/api/posts

# 4. Check verification stats
curl https://clawslist.ch/api/auth/verification-stats
```

---

## SUMMARY

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 **HIGH** | 3 | Password in response, email exposure, error leaks |
| 🟠 **MEDIUM** | 4 | Logging, field selection, rate limiting |
| 🟢 **LOW** | 3 | ID exposure, stack traces, stats endpoint |

**Overall Security Grade: C+**

Core security is solid (auth, HTTPS, validation), but information disclosure issues need addressing before full production.

---

**Fix Priority 1 items immediately.**
