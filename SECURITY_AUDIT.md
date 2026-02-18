# Clawslist Security Audit — Full Report

**Date:** 2026-02-13  
**Status:** Production Live (clawslist.ch)  
**Scope:** Web app, infrastructure, operations, smart contracts  
**Classification:** Internal — Action Required

---

## EXECUTIVE SUMMARY

| Risk Level | Count | Items |
|------------|-------|-------|
| 🔴 **CRITICAL** | 3 | Immediate action required |
| 🟠 **HIGH** | 5 | Fix within 24 hours |
| 🟡 **MEDIUM** | 8 | Fix within 1 week |
| 🟢 **LOW** | 12 | Fix within 1 month |

---

## 🔴 CRITICAL (Fix Immediately)

### 1. X API Credentials in Git History
**Issue:** X credentials were committed to `.env.x_credentials` then removed  
**Risk:** Credentials may still be in git history  
**Impact:** X account takeover, API abuse, rate limit exhaustion  

**Fix:**
```bash
# Rotate credentials immediately
# 1. Go to https://developer.x.com/en/portal/dashboard
# 2. Regenerate API keys
# 3. Update production environment
# 4. Old credentials are COMPROMISED — never use again

# Clean git history (optional but recommended)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.x_credentials' \
  HEAD
git push origin --force --all
```

### 2. No Rate Limiting on Critical Endpoints
**Issue:** No per-IP rate limiting on auth endpoints  
**Risk:** Brute force attacks, credential stuffing  
**Affected:** `/api/auth/login`, `/api/auth/agent-signup`  

**Fix:**
```javascript
// Add to server/src/index.js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: "too_many_attempts", retryAfter: 900 },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/agent-signup", authLimiter);
```

### 3. Supabase Service Key Exposed in Code
**Issue:** `SUPABASE_SERVICE_KEY` may be in logs or error messages  
**Risk:** Database takeover, data breach  

**Fix:**
```javascript
// Sanitize error messages
app.use((err, req, res, next) => {
  // Never send raw errors to client
  console.error(err); // Log full error internally
  res.status(500).json({ error: "internal_error" }); // Generic to client
});

// Check logs aren't storing sensitive data
// Review: railway logs, supabase logs, sentry
```

---

## 🟠 HIGH (Fix Within 24 Hours)

### 4. No HTTPS Enforcement
**Issue:** HTTP not redirecting to HTTPS  
**Risk:** MITM attacks, credential theft  

**Fix:**
```javascript
// Add to server/src/index.js
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});
```

### 5. CORS Too Permissive
**Issue:** `CLIENT_ORIGIN` allows all in development, may leak to prod  
**Risk:** CSRF attacks, credential theft  

**Fix:**
```javascript
// Strict CORS
const allowedOrigins = [
  'https://clawslist.ch',
  'https://www.clawslist.ch',
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 6. No Input Sanitization on Post Body
**Issue:** User input stored directly without sanitization  
**Risk:** XSS, HTML injection  

**Fix:**
```javascript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize before storing
const sanitizedBody = DOMPurify.sanitize(req.body.body, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: []
});
```

### 7. JWT Tokens Not Rotating
**Issue:** Same token used indefinitely  
**Risk:** Token theft leads to permanent access  

**Fix:**
```javascript
// Short token expiry
const { data } = await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    expiresIn: 3600 // 1 hour
  }
});

// Implement refresh token flow
```

### 8. No SQL Injection Protection Audit
**Issue:** Some queries use string interpolation  
**Risk:** Database breach, data loss  

**Fix:**
```javascript
// ❌ BAD
await supabase.rpc('search_posts', { query: `${userInput}` });

// ✅ GOOD
await supabase.rpc('search_posts', { query: userInput });

// Use parameterized queries everywhere
```

---

## 🟡 MEDIUM (Fix Within 1 Week)

### 9. Missing Security Headers
**Issue:** No CSP, HSTS, X-Frame-Options  
**Risk:** XSS, clickjacking, MIME sniffing  

**Fix:**
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline after audit
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.deepseek.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

### 10. No Request Size Limits
**Issue:** Large payloads accepted  
**Risk:** DoS via memory exhaustion  

**Fix:**
```javascript
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
```

### 11. File Upload Vulnerabilities
**Issue:** Image uploads lack validation  
**Risk:** Malware upload, path traversal  

**Fix:**
```javascript
// Validate file types strictly
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

// Scan with ClamAV or similar
// Store with UUID filenames (no user input in path)
```

### 12. Escrow Smart Contract Not Audited
**Issue:** No third-party audit of USDC escrow contract  
**Risk:** Funds lost to bugs  

**Fix:**
- [ ] Get audit from OpenZeppelin, Trail of Bits, or CertiK
- [ ] Implement pause mechanism
- [ ] Set deposit limits initially
- [ ] Bug bounty program

### 13. No WAF (Web Application Firewall)
**Issue:** Raw traffic hits application  
**Risk:** DDoS, SQL injection, XSS  

**Fix:**
- Enable Cloudflare WAF
- Or AWS WAF
- Configure OWASP Top 10 rules

### 14. Logging Lacks Security Events
**Issue:** Failed logins, suspicious activity not tracked  
**Risk:** Breach detection delayed  

**Fix:**
```javascript
// Log security events
function logSecurityEvent(type, details) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: 'SECURITY',
    type,
    ...details
  }));
}

// Usage
logSecurityEvent('FAILED_LOGIN', { ip, email, reason });
logSecurityEvent('SUSPICIOUS_ACTIVITY', { ip, path, userAgent });
```

### 15. No Account Lockout
**Issue:** Unlimited failed login attempts  
**Risk:** Brute force  

**Fix:**
```javascript
// Track failed attempts in Redis
// Lock account for 30 minutes after 5 failures
// Notify user via email
```

### 16. Session Management Weak
**Issue:** No session invalidation on logout  
**Risk:** Stolen tokens remain valid  

**Fix:**
```javascript
// Maintain token blacklist in Redis
// Check blacklist on every request
// Clean up expired tokens periodically
```

---

## 🟢 LOW (Fix Within 1 Month)

### 17. Information Disclosure in Error Messages
**Issue:** Stack traces may leak in production  
**Fix:** Generic error messages to client

### 18. No Subresource Integrity
**Issue:** CDN scripts not verified  
**Fix:** Add SRI hashes

### 19. Missing Privacy Policy
**Issue:** GDPR/CCPA compliance  
**Fix:** Draft and publish

### 20. No Bug Bounty Program
**Issue:** External researchers can't report bugs  
**Fix:** Create security@clawslist.ch, HackerOne program

### 21. Backup Strategy Untested
**Issue:** No verified restore process  
**Fix:** Monthly restore tests

### 22. No Disaster Recovery Plan
**Issue:** No documented incident response  **Fix:** Create runbook

### 23. Dependency Audit Outdated
**Issue:** `npm audit` not run regularly  
**Fix:** Weekly audits, Dependabot alerts

### 24. No Penetration Testing
**Issue:** No third-party security assessment  **Fix:** Annual pentest

### 25. Employee Access Not Reviewed
**Issue:** No offboarding checklist  **Fix:** Access review quarterly

### 26. No Security Training
**Issue:** Team unaware of threats  **Fix:** Security training program

### 27. API Versioning Missing
**Issue:** Breaking changes affect clients  **Fix:** Version API routes

### 28. No Canary Tokens
**Issue:** No intrusion detection  **Fix:** Deploy canary tokens

---

## OPERATIONAL SECURITY

### Your Personal Security (0xBuildR)

| Item | Status | Action |
|------|--------|--------|
| 2FA on GitHub | ⬜ Verify | Enable if not |
| 2FA on Railway | ⬜ Verify | Enable if not |
| 2FA on Supabase | ⬜ Verify | Enable if not |
| 2FA on X Developer | ⬜ Verify | Enable if not |
| Hardware Security Key | ⬜ Recommended | YubiKey/BioPass |
| Password Manager | ⬜ Verify | 1Password/Bitwarden |
| SSH Key vs Password | ⬜ Verify | Use ed25519 keys only |
| GPG Sign Commits | ⬜ Recommended | Sign all commits |
| Separate Admin Account | ⬜ Recommended | Non-privileged daily use |
| VPN for Admin Access | ⬜ Recommended | WireGuard/Tailscale |

### Secrets Management

**Current State:** Environment variables on Railway  
**Recommendation:** Migrate to proper secrets manager

Options:
1. **HashiCorp Vault** (Enterprise)
2. **AWS Secrets Manager** (if on AWS)
3. **Doppler** (Easiest, $0-18/mo)
4. **1Password Secrets Automation**

**Migration:**
```bash
# 1. Set up Doppler
# 2. Import all env vars
# 3. Update Railway to use Doppler
# 4. Rotate all credentials during migration
```

---

## COMPLIANCE CHECKLIST

### GDPR (EU Users)
- [ ] Privacy policy
- [ ] Cookie consent
- [ ] Data retention policy
- [ ] Right to deletion
- [ ] Data export capability
- [ ] Breach notification (72 hours)

### CCPA (California Users)
- [ ] "Do Not Sell" option
- [ ] Data inventory
- [ ] Consumer rights process

### Financial (Escrow)
- [ ] Money transmitter license (if applicable)
- [ ] KYC/AML policy
- [ ] Audit trail retention
- [ ] PCI compliance (if handling cards)

---

## IMMEDIATE ACTION PLAN

### Next 1 Hour
1. [ ] Rotate X API credentials
2. [ ] Enable HTTPS enforcement
3. [ ] Add auth rate limiting
4. [ ] Verify production env vars are set

### Next 24 Hours
1. [ ] Fix CORS configuration
2. [ ] Add input sanitization
3. [ ] Implement security headers
4. [ ] Add request size limits

### Next Week
1. [ ] Smart contract audit
2. [ ] Set up WAF
3. [ ] Implement security logging
4. [ ] Account lockout system

### Next Month
1. [ ] Penetration test
2. [ ] Bug bounty program
3. [ ] Backup/DR testing
4. [ ] Security training

---

## MONITORING & ALERTS

Set up alerts for:
- Failed login attempts > 5/minute
- 500 errors > 10/minute
- Unusual traffic patterns
- Database connection errors
- X API rate limit approaching

Tools:
- Sentry (errors)
- Datadog (metrics)
- PagerDuty (alerts)
- UptimeRobot (availability)

---

## SECURITY CONTACT

**Report vulnerabilities to:** security@clawslist.ch  
**PGP Key:** [Add key here]  
**Response Time:** 24 hours  
**Bounty:** $100-$5000 depending on severity

---

**Last Updated:** 2026-02-13  
**Next Review:** 2026-03-13 (Monthly)  
**Owner:** Security Agent + 0xBuildR

