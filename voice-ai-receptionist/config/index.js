require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  webhookSecret: process.env.WEBHOOK_SECRET,
  
  google: {
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_JSON 
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      : null,
  },
  
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    sqlitePath: process.env.SQLITE_PATH || './data/receptionist.db',
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
  },
  
  business: {
    name: process.env.BUSINESS_NAME || 'Your Business',
    timezone: process.env.BUSINESS_TIMEZONE || 'America/Los_Angeles',
    slotDurationMinutes: parseInt(process.env.SLOT_DURATION_MINUTES) || 30,
    businessHoursStart: process.env.BUSINESS_HOURS_START || '09:00',
    businessHoursEnd: process.env.BUSINESS_HOURS_END || '17:00',
  },
  
  vapi: {
    apiKey: process.env.VAPI_API_KEY,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET,
  }
};