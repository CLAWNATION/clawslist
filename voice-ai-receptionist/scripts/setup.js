#!/usr/bin/env node

/**
 * Setup script for Voice AI Receptionist
 * Creates necessary directories and validates configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🎙️  Voice AI Receptionist Setup\n');

// Create necessary directories
const dirs = [
  'logs',
  'data',
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}/`);
  } else {
    console.log(`✓ Directory exists: ${dir}/`);
  }
});

// Check environment file
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\n⚠️  Created .env from .env.example');
    console.log('📝 Please edit .env and add your credentials');
  } else {
    console.log('\n❌ .env.example not found');
  }
} else {
  console.log('\n✓ .env file exists');
}

// Validate required env vars
require('dotenv').config();

const required = [
  'GOOGLE_CALENDAR_ID',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
];

const missing = required.filter(key => !process.env[key]);

console.log('\n📋 Configuration Check:');

if (missing.length === 0) {
  console.log('✅ All required environment variables set');
} else {
  console.log('⚠️  Missing required variables:');
  missing.forEach(key => console.log(`   - ${key}`));
}

// Optional checks
const optional = [
  { key: 'SUPABASE_URL', label: 'Database (Supabase)' },
  { key: 'SMTP_HOST', label: 'Email (SMTP)' },
  { key: 'VAPI_API_KEY', label: 'Vapi Integration' },
];

console.log('\n📋 Optional Integrations:');
optional.forEach(({ key, label }) => {
  const status = process.env[key] ? '✅' : '⚪';
  console.log(`   ${status} ${label}`);
});

console.log('\n🚀 Setup complete! Run `npm run dev` to start the server.\n');