require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  
  // Twilio for Voice & SMS
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  // Vapi for Voice AI
  vapi: {
    apiKey: process.env.VAPI_API_KEY,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET,
  },
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  // Stripe for Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // HelloSign/DocuSign for E-Signature (using HelloSign API)
  hellosign: {
    apiKey: process.env.HELLOSIGN_API_KEY,
    clientId: process.env.HELLOSIGN_CLIENT_ID,
  },
  
  // App branding
  app: {
    name: process.env.APP_NAME || 'Helping Hand',
    supportPhone: process.env.SUPPORT_PHONE,
    supportEmail: process.env.SUPPORT_EMAIL,
  }
};