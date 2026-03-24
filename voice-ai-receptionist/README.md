# Voice AI Receptionist

> Open-source replacement for n8n workflow #3427. Clean code, no vendor lock-in.

## What It Does

An AI-powered voice receptionist that:
- **Answers inbound calls** via Vapi voice AI
- **Checks availability** in Google Calendar
- **Books/updates/cancels** appointments
- **Sends email confirmations** to callers
- **Logs all interactions** to database
- **Handles transcripts** and call summaries

## Architecture

```
Inbound Call (Vapi)
    ↓
Webhook Handler (Express)
    ↓
Intent Router → GetSlots | BookSlot | UpdateSlot | CancelSlot
    ↓
Google Calendar API
    ↓
Database (Supabase/SQLite) + Email (Nodemailer)
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Fill in your credentials:
# - VAPI_WEBHOOK_SECRET (from Vapi dashboard)
# - GOOGLE_CALENDAR_ID (your calendar)
# - GOOGLE_SERVICE_ACCOUNT_JSON (service account key)
# - SUPABASE_URL + SUPABASE_KEY (or use SQLite)
# - SMTP_HOST, SMTP_USER, SMTP_PASS (for email)

# 4. Run setup
npm run setup

# 5. Start server
npm run dev
```

## Webhook Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook/vapi` | POST | Main Vapi webhook (intent routing) |
| `/slots/available` | POST | Get available time slots |
| `/slots/book` | POST | Book an appointment |
| `/slots/update` | POST | Reschedule appointment |
| `/slots/cancel` | POST | Cancel appointment |
| `/call/end` | POST | End-of-call report handler |

## Vapi Assistant Configuration

Use this system prompt in your Vapi assistant:

```
You are a professional receptionist for {{business_name}}. Your job is to help callers schedule, reschedule, or cancel appointments.

CAPABILITIES:
- Check availability for a date/time
- Book new appointments
- Reschedule existing appointments
- Cancel appointments
- Send confirmation emails

WORKFLOW:
1. Greet the caller warmly
2. Identify their need (book, reschedule, cancel)
3. Collect required info: name, phone, service type, preferred date/time
4. Use function calls to interact with the calendar system
5. Confirm details before finalizing
6. Send confirmation via email if provided

TONE: Professional, friendly, efficient. Speak clearly.

If the caller is unsure of timing, offer 3 available slots within their preferred timeframe.
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
WEBHOOK_SECRET=your_vapi_webhook_secret

# Google Calendar
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Database (Supabase recommended, SQLite for local)
DATABASE_TYPE=supabase  # or 'sqlite'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Receptionist <reception@yourbusiness.com>"

# Business Config
BUSINESS_NAME="Your Business"
BUSINESS_TIMEZONE="America/Los_Angeles"
SLOT_DURATION_MINUTES=30
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00
```

## API Reference

### Get Available Slots
```http
POST /slots/available
Content-Type: application/json

{
  "date": "2024-03-25",
  "duration_minutes": 30
}
```

Response:
```json
{
  "available_slots": [
    "09:00",
    "09:30", 
    "10:00",
    "14:00",
    "14:30"
  ]
}
```

### Book Appointment
```http
POST /slots/book
Content-Type: application/json

{
  "caller_name": "John Doe",
  "caller_phone": "+1-555-123-4567",
  "caller_email": "john@example.com",
  "date": "2024-03-25",
  "time": "09:30",
  "service_type": "Consultation",
  "notes": "First-time caller"
}
```

### Reschedule Appointment
```http
POST /slots/update
Content-Type: application/json

{
  "appointment_id": "evt_abc123",
  "new_date": "2024-03-26",
  "new_time": "14:00"
}
```

### Cancel Appointment
```http
POST /slots/cancel
Content-Type: application/json

{
  "appointment_id": "evt_abc123",
  "reason": "Caller requested cancellation"
}
```

## Database Schema

### calls table
```sql
create table calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text unique,
  caller_number text,
  caller_name text,
  status text, -- 'completed', 'failed', 'no-answer'
  started_at timestamp,
  ended_at timestamp,
  duration_seconds int,
  transcript text,
  summary text,
  intent text, -- 'book', 'reschedule', 'cancel', 'inquiry'
  appointment_id text,
  created_at timestamp default now()
);
```

### appointments table
```sql
create table appointments (
  id uuid primary key default gen_random_uuid(),
  google_event_id text unique,
  caller_name text,
  caller_phone text,
  caller_email text,
  service_type text,
  appointment_date date,
  appointment_time time,
  duration_minutes int default 30,
  status text default 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## Deployment

### Railway/Render (Recommended)
```bash
# One-click deploy to Railway
railway login
railway init
railway up
```

### Docker
```bash
docker build -t voice-receptionist .
docker run -p 3000:3000 --env-file .env voice-receptionist
```

### VPS (PM2)
```bash
npm install -g pm2
pm2 start src/server.js --name receptionist
pm2 save
pm2 startup
```

## Monitoring

Logs are written to:
- Console (development)
- `logs/combined.log` (production)
- `logs/error.log` (errors only)

Health check: `GET /health`

## Why Not n8n?

| n8n | This Solution |
|-----|---------------|
| Visual spaghetti | Clean, testable code |
| $20-50/month hosting | $5/month VPS or free tier |
| Vendor lock-in | Full source control |
| Limited error handling | Proper logging & retry logic |
| Black box debugging | Step-through debugging |

## License

MIT. Built for builders.
