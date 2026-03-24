const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const voiceRoutes = require('./voice/routes');
const smsRoutes = require('./sms/routes');
const paymentRoutes = require('./payments/routes');
const esignRoutes = require('./esignature/routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For Stripe webhooks

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/esign', esignRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`🚀 Helping Hand Server running on port ${config.port}`);
  console.log(`📞 Voice webhook: ${config.baseUrl}/api/voice/webhook`);
  console.log(`💬 SMS webhook: ${config.baseUrl}/api/sms/webhook`);
});

module.exports = app;