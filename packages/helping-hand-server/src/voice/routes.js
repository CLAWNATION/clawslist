const express = require('express');
const router = express.Router();
const voiceService = require('./voiceService');

// Twilio voice webhook
router.post('/webhook', (req, res) => {
  const twiml = voiceService.generateVoiceResponse();
  res.type('text/xml');
  res.send(twiml);
});

// Vapi webhook for function calls
router.post('/vapi', async (req, res) => {
  try {
    const result = await voiceService.handleVapiWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Vapi webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;