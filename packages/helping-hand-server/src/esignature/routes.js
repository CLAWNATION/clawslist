const express = require('express');
const router = express.Router();
const esignService = require('./esignService');

// Request e-signature
router.get('/request', async (req, res) => {
  try {
    const { booking, email, name } = req.query;
    
    if (!booking) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const result = await esignService.createSignatureRequest({
      bookingId: booking,
      signerEmail: email,
      signerName: name,
    });

    // Redirect to signing page or show embedded
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>✍️ Service Agreement</h1>
          <p>Please review and sign the service agreement for your booking.</p>
          <iframe src="${result.signUrl}" width="100%" height="800" frameborder="0"></iframe>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('E-sign error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HelloSign webhook
router.post('/webhook', async (req, res) => {
  try {
    const result = await esignService.handleWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('E-sign webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Callback page
router.get('/callback', (req, res) => {
  const { event } = req.query;
  
  if (event === 'signature_request_signed') {
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ Agreement Signed!</h1>
          <p>Thank you for signing the service agreement.</p>
          <p>You'll receive a payment link via SMS to complete your booking.</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Agreement Process</h1>
          <p>Status: ${event}</p>
        </body>
      </html>
    `);
  }
});

module.exports = router;