const express = require('express');
const router = express.Router();
const paymentService = require('./paymentService');

// Create checkout session
router.get('/checkout', async (req, res) => {
  try {
    const { booking } = req.query;
    
    if (!booking) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const session = await paymentService.createCheckoutSession({
      bookingId: booking,
      successUrl: `${req.protocol}://${req.get('host')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${req.protocol}://${req.get('host')}/payment/cancel?booking=${booking}`,
    });

    res.redirect(session.url);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json({ received: true, ...result });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Success page
router.get('/success', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ Payment Successful!</h1>
        <p>Your booking is confirmed. You will receive a confirmation SMS shortly.</p>
        <p>You can close this window.</p>
      </body>
    </html>
  `);
});

// Cancel page
router.get('/cancel', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: orange;">⚠️ Payment Cancelled</h1>
        <p>Your booking is reserved for 24 hours. Complete payment to confirm.</p>
        <a href="/api/payments/checkout?booking=${req.query.booking}">Try Again</a>
      </body>
    </html>
  `);
});

module.exports = router;