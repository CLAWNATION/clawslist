# Helping Hand Server

Voice AI + SMS + Payments + E-Signature backend for the Helping Hand app.

## What It Does

- **Voice AI**: Handles inbound calls for booking care services
- **SMS**: Sends confirmation texts, payment links, reminders
- **Payments**: Stripe checkout for booking payments
- **E-Signature**: HelloSign integration for service agreements

## Quick Start

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## API Endpoints

### Voice
- `POST /api/voice/webhook` - Twilio voice webhook
- `POST /api/voice/vapi` - Vapi AI function calls

### SMS
- `POST /api/sms/webhook` - Incoming SMS handler
- `POST /api/sms/send` - Send SMS (admin)

### Payments
- `GET /api/payments/checkout?booking=xxx` - Stripe checkout
- `POST /api/payments/webhook` - Stripe webhooks

### E-Signature
- `GET /api/esign/request?booking=xxx` - Request signature
- `POST /api/esign/webhook` - HelloSign webhooks

## Database Schema Additions

```sql
-- Voice intake records
create table voice_intakes (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text,
  caller_name text,
  caller_phone text,
  service_type text,
  description text,
  location text,
  preferred_date date,
  preferred_time time,
  budget decimal(10,2),
  status text default 'intake_complete',
  transcript text,
  created_at timestamp default now()
);

-- Bookings (additions to existing)
alter table bookings add column voice_intake_id uuid references voice_intakes(id);
alter table bookings add column payment_intent_id text;
alter table bookings add column signature_request_id text;
alter table bookings add column signed_at timestamp;
alter table bookings add column paid_at timestamp;

-- Voice calls log
create table voice_calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text unique,
  caller_number text,
  duration_seconds int,
  transcript text,
  summary text,
  status text,
  created_at timestamp default now()
);

-- SMS log
create table sms_logs (
  id uuid primary key default gen_random_uuid(),
  to_number text not null,
  from_number text not null,
  body text not null,
  message_sid text,
  status text,
  sent_at timestamp default now()
);

-- Signature requests
create table signature_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  signature_request_id text,
  signer_email text,
  status text default 'sent',
  created_at timestamp default now()
);
```