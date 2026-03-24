const express = require('express');
const router = express.Router();
const smsService = require('./smsService');

// Twilio SMS webhook
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body;
    const result = await smsService.handleIncomingReply(From, Body);
    
    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.reply}</Message>
</Response>`;
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).send('Error');
  }
});

// Send SMS manually (for admin)
router.post('/send', async (req, res) => {
  try {
    const { to, body } = req.body;
    const result = await smsService.sendMessage({ to, body });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;