# Work Queue — Helping Hand App Store Launch 🚀

**Mission:** Get Helping Hand to iOS App Store and Google Play Store  
**Stack:** React Native (Expo)  
**Last Updated:** 2026-02-21 23:10 UTC  
**Status:** SWARM ACTIVATED — All agents on deck

---

## P0 — CRITICAL PATH (Do First)

### 1. 🎨 App Assets & Branding
**Status:** ✅ COMPLETE (Placeholder Assets)  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 09:15 UTC  
**ETA:** 24 hours

- [x] Create 1024x1024 app icon (iOS + Android)
- [x] Create 1242x2436 splash screen
- [x] Create Android adaptive icon foreground (432x432)
- [x] Create Android adaptive icon background (432x432)
- [x] Update app.json with new assets
- [ ] Generate all required sizes via `npx expo prebuild`
- [ ] Replace with final branded assets

**Output:** 
- `/helping-hand/assets/images/app-icon.png` — App icon (placeholder)
- `/helping-hand/assets/images/splash.png` — Splash screen (placeholder)

**Note:** Placeholder assets created from existing natively-dark.png. Replace with final branded assets before launch.

---

### 2. 📱 App Store Screenshots (5 per platform)
**Status:** ✅ COMPLETE (Mock Screenshots)  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 10:15 UTC  
**ETA:** 48 hours

- [x] Screenshot specification created
- [x] Mock screenshots generated (HTML)
- [x] Screenshot capture script created
- [ ] Capture final screenshots from actual app
- [ ] Create Android feature graphic (1024x500)

**Output:**
- `/helping-hand/scripts/mock-screenshots.html` — 5 mock iPhone screens
- `/helping-hand/scripts/capture-screenshots.sh` — Capture script
- `/helping-hand/SCREENSHOT_SPECIFICATION.md` — Detailed spec

**Screenshots Created:**
1. ✅ Home/Job feed — Helper listings with ratings
2. ✅ Helper profile — Full profile with skills
3. ✅ Messaging interface — Chat bubbles
4. ✅ Booking flow — Pricing breakdown
5. ✅ Payment/Rating — Confirmation screen

**Note:** HTML mockups ready. Capture using browser DevTools or replace with actual app screenshots.

---

### 3. 🔒 Privacy Policy & Terms
**Status:** ✅ COMPLETE  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 06:30 UTC  
**ETA:** 12 hours

- [x] Review existing `PRIVACY_POLICY.md`
- [x] Review existing `TERMS_OF_SERVICE.md`
- [x] Create HTML versions for web hosting
- [ ] Deploy to website (privacy.helpinghand.app or helping-hand.app/privacy)
- [ ] Update URLs in app store listings

**Output:** 
- `/helping-hand/public/privacy.html` — Styled privacy policy page
- `/helping-hand/public/terms.html` — Styled terms of service page  
- `/helping-hand/public/index.html` — Landing page with links

---

### 4. ⚙️ Production Backend Setup
**Status:** 🔴 Not Started  
**Assigned:** Infra Agent  
**ETA:** 24 hours

**Supabase Production:**
- [ ] Create new Supabase project (prod)
- [ ] Migrate database schema
- [ ] Copy RLS policies from dev
- [ ] Set up production auth
- [ ] Configure storage buckets
- [ ] Get production API URL + anon key

**Stripe Production:**
- [ ] Activate Stripe account
- [ ] Complete business verification
- [ ] Get production publishable key
- [ ] Configure 15% platform fee
- [ ] Set up webhook endpoint

---

### 5. 📲 Developer Account Setup
**Status:** 🔴 Not Started  
**Assigned:** 0xBuildR (owner) + Infra Agent  
**ETA:** 48 hours

**Apple App Store Connect:**
- [ ] Apple Developer Program ($99/year)
- [ ] Create app record: "Helping Hand"
- [ ] Bundle ID: `com.helpinghand.app`
- [ ] Reserve app name
- [ ] Add 0xBuildR as admin

**Google Play Console:**
- [ ] Google Play Developer Account ($25)
- [ ] Create app listing
- [ ] Package name: `com.helpinghand.app`
- [ ] Add 0xBuildR as admin

---

## P1 — BUILD & TEST

### 6. 🔧 EAS Build Configuration
**Status:** ✅ COMPLETE  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 08:15 UTC  
**ETA:** 12 hours

- [x] Update eas.json with CLI version
- [x] Add production environment variables
- [x] Configure iOS submit (App Store Connect)
- [x] Configure Android submit (Google Play)

**Configuration:**
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "${SUPABASE_URL}",
        "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "${STRIPE_PUBLISHABLE_KEY}"
      }
    }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "${APPLE_APP_ID}", "ascTeamId": "${APPLE_TEAM_ID}" },
      "android": { "track": "production" }
    }
  }
}
```

**Next:** Set EAS secrets with actual values via `eas secret:create`

---

### 7. 🧪 Production Build & Test
**Status:** 🔴 Not Started  
**Assigned:** QA Agent  
**ETA:** 24 hours

```bash
# Commands to run:
eas build --platform ios --profile production
eas build --platform android --profile production
```

- [ ] iOS build succeeds
- [ ] Android build succeeds
- [ ] Test on physical iPhone
- [ ] Test on physical Android
- [ ] Verify push notifications work
- [ ] Verify payments work
- [ ] Check bundle size < 50MB

---

### 8. 📝 App Store Listing Content
**Status:** ✅ COMPLETE  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 07:15 UTC  
**ETA:** 8 hours

**iOS App Store:**
- [x] App Name: "Helping Hand" (30 chars)
- [x] Subtitle: "Find local help, fast" (30 chars)
- [x] Description (4000 chars)
- [x] Keywords (100 chars)
- [x] Support URL
- [x] Privacy Policy URL
- [x] Demo account credentials

**Google Play:**
- [x] App Title (50 chars)
- [x] Short Description (80 chars)
- [x] Full Description (4000 chars)

**Output:** `/helping-hand/APP_STORE_CONTENT.md` — Complete listing content ready to copy-paste

---

## P2 — SUBMIT & LAUNCH

### 9. 🚀 Submit to App Stores
**Status:** 🔴 Not Started  
**ETA:** 24 hours after P0/P1 complete

```bash
# Submit commands:
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

- [ ] iOS submitted for review
- [ ] Android submitted for review
- [ ] App Review Information complete
- [ ] Notes for reviewer added

---

### 10. 📊 Post-Launch Monitoring
**Status:** ✅ COMPLETE (Configuration)  
**Assigned:** Jarvis  
**Completed:** 2026-02-21 12:10 UTC  
**ETA:** Ongoing

- [x] Sentry error tracking configured
- [x] Analytics service created
- [x] Support email setup (docs created)
- [x] Crash monitoring — Firebase Crashlytics (service created)

**Output:** 
- `/helping-hand/services/sentryService.ts` — Sentry integration
- `/helping-hand/services/analyticsService.ts` — Multi-provider analytics
- `/helping-hand/services/crashlyticsService.ts` — Firebase Crashlytics
- `/helping-hand/docs/SUPPORT_SETUP.md` — Support email guide

**Setup required:**
Sentry:
1. Create project at sentry.io
2. Add EXPO_PUBLIC_SENTRY_DSN to environment
3. Install: `npx expo install @sentry/react-native`

Analytics:
1. Choose provider (Mixpanel/Amplitude/Firebase)
2. Add EXPO_PUBLIC_ANALYTICS_PROVIDER and EXPO_PUBLIC_ANALYTICS_API_KEY
3. Install provider SDK

Crashlytics:
1. Create Firebase project
2. Add apps to Firebase
3. Install: `npx expo install @react-native-firebase/crashlytics`

Support Email:
1. Choose provider (Google Workspace recommended)
2. Configure support@helpinghand.app
3. Set up DNS MX records

---

## SWARM ASSIGNMENTS

| Agent | Role | Current Task | Status |
|-------|------|--------------|--------|
| Design | Visual Assets | App icons, splash screen | 🟡 Active |
| UI/UX | Screenshots | 5 iOS + 5 Android screenshots | 🔴 Ready |
| Infra | Backend | Production Supabase + Stripe | 🔴 Ready |
| Content | Copy | App store descriptions, listing | 🔴 Ready |
| Build | EAS/CI | Build config, binaries | 🔴 Ready |
| QA | Testing | Device testing, bug fixes | 🔴 Ready |

---

## CRITICAL PATH TIMELINE

| Day | Milestone |
|-----|-----------|
| Day 1 (Today) | App assets complete, Privacy/Terms hosted |
| Day 2 | Production backend live, Developer accounts ready |
| Day 3 | Screenshots complete, EAS builds configured |
| Day 4 | Production builds created, device testing |
| Day 5 | App store listings complete, submitted |
| Day 6-8 | App review (iOS 1-3 days, Android 1-2 days) |
| Day 9 | 🚀 GO LIVE |

---

## BLOCKERS

| Issue | Impact | Owner | Resolution |
|-------|--------|-------|------------|
| Need Apple Developer Account | High | 0xBuildR | Enroll at developer.apple.com |
| Need Google Play Account | High | 0xBuildR | Enroll at play.google.com/console |
| Stripe Business Verification | Medium | 0xBuildR | Submit business docs to Stripe |

---

## NEXT ACTIONS (Immediate)

1. **0xBuildR:** Enroll in Apple Developer Program + Google Play Console
2. **Design Agent:** Create app icon + splash screen assets
3. **Infra Agent:** Set up production Supabase project
4. **Content Agent:** Finalize app store descriptions

---

**Repo:** github.com/0xMonsta/helping-hand  
**Build Command:** `eas build --platform all --profile production`  
**App Status:** Ready for production pipeline

---

*Last commit: Checking helping-hand repo...*
