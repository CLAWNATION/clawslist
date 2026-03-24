const stripe = require('stripe')(require('../config').stripe.secretKey);
const config = require('../config');
const supabaseService = require('../services/supabase');

class PaymentService {
  async createCheckoutSession({ bookingId, successUrl, cancelUrl }) {
    // Get booking details
    const booking = await supabaseService.getBooking(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Calculate amount (use budget from booking or default)
    const amount = booking.budget || 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${booking.service_type} - Helping Hand`,
            description: `Booking #${bookingId} - ${booking.description || 'Care services'}`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${config.baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${config.baseUrl}/payment/cancel?booking=${bookingId}`,
      customer_email: booking.seeker_email,
      metadata: {
        booking_id: bookingId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhook(payload, signature) {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata.booking_id;
        
        // Update booking status
        await supabaseService.updateBookingStatus(bookingId, 'paid', {
          payment_intent_id: session.payment_intent,
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
        });

        console.log(`✅ Payment completed for booking ${bookingId}`);
        return { type: 'payment_completed', bookingId };
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const bookingId = session.metadata.booking_id;
        
        await supabaseService.updateBookingStatus(bookingId, 'payment_expired');
        return { type: 'payment_expired', bookingId };
      }

      default:
        return { type: event.type, received: true };
    }
  }
}

module.exports = new PaymentService();