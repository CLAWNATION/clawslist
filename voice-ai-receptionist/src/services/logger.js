const winston = require('winston');
const path = require('path');
const config = require('../config');

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voice-receptionist' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transports in production
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs/error.log'),
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs/combined.log'),
  }));
}

module.exports = logger;