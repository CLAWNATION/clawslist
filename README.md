# Helping Hand Monorepo

## Structure

```
packages/
├── helping-hand/           # React Native mobile app (Expo)
│   ├── src/               # App source code
│   ├── App.tsx
│   └── package.json
│
└── helping-hand-server/   # Voice AI + SMS + Payments server
    ├── src/               # Server source code
    │   ├── voice/         # AI voice handling
    │   ├── sms/           # SMS service
    │   ├── payments/      # Stripe integration
    │   └── esignature/    # HelloSign integration
    └── package.json
```

## Quick Start

### Run both (development)
```bash
# Terminal 1 - Mobile App
npm run dev:app

# Terminal 2 - Voice/AI Server
npm run dev:server
```

### Run independently

**Mobile App only:**
```bash
cd packages/helping-hand
npm install
npm run dev
```

**Server only:**
```bash
cd packages/helping-hand-server
npm install
cp .env.example .env
# Add your credentials
npm run dev
```

## What Each Package Does

### helping-hand (Mobile App)
- React Native app for iOS/Android
- Helper & seeker matching
- In-app messaging
- Booking management
- Push notifications

### helping-hand-server (Voice AI Server)
- Handles inbound AI voice calls
- SMS confirmations & reminders
- Stripe payment processing
- HelloSign e-signatures
- Runs independently on Railway/VPS

## Environment Setup

Each package has its own `.env` file:

- `packages/helping-hand/.env` - Supabase keys, API URLs
- `packages/helping-hand-server/.env` - Twilio, Stripe, Vapi keys

## Deployment

| Package | Platform | Command |
|---------|----------|---------|
| Mobile App | App Store/Play Store | `eas build --platform all` |
| Server | Railway/Render/AWS | `railway up` or `docker build` |

## API Communication

```
Mobile App ──────► Supabase (shared database)
                      ▲
Voice Server ────────┘
    │
    ├──► Twilio (Voice/SMS)
    ├──► Stripe (Payments)
    └──► HelloSign (E-Sign)
```