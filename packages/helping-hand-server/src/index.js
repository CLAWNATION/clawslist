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

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For Stripe webhooks
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Health check with uptime
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/esign', esignRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown handling
const server = app.listen(config.port, () => {
  console.log(`🚀 Helping Hand Server running on port ${config.port}`);
  console.log(`📞 Voice webhook: ${config.baseUrl}/api/voice/webhook`);
  console.log(`💬 SMS webhook: ${config.baseUrl}/api/sms/webhook`);
  console.log(`🏥 Health check: ${config.baseUrl}/health`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;