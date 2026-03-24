const { Twilio } = require('twilio');
const config = require('../config');
const supabaseService = require('../services/supabase');

const twilio = new Twilio(config.twilio.accountSid, config.twilio.authToken);

class SMSService {
  async sendBookingConfirmation({ to, bookingId, seekerName, serviceType, date, time, amount }) {
    const paymentUrl = `${config.baseUrl}/api/payments/checkout?booking=${bookingId}`;
    const esignUrl = `${config.baseUrl}/api/esign/request?booking=${bookingId}`;

    const body = `Hi ${seekerName}! Your ${serviceType} booking is confirmed for ${date} at ${time}.

💳 Pay $${amount}: ${paymentUrl}
✍️ Sign agreement: ${esignUrl}

Reply HELP for assistance or call ${config.app.supportPhone}`;

    return this.sendMessage({ to, body });
  }

  async sendPaymentReminder({ to, seekerName, bookingId, amount }) {
    const paymentUrl = `${config.baseUrl}/api/payments/checkout?booking=${bookingId}`;

    const body = `Hi ${seekerName}, please complete payment of $${amount} for your upcoming booking:

${paymentUrl}

Your booking is reserved for 24 hours. Questions? Call ${config.app.supportPhone}`;

    return this.sendMessage({ to, body });
  }

  async sendEsignReminder({ to, seekerName, bookingId }) {
    const esignUrl = `${config.baseUrl}/api/esign/request?booking=${bookingId}`;

    const body = `Hi ${seekerName}, please sign your service agreement before your booking:

${esignUrl}

This ensures both you and your helper are protected. Questions? Reply here.`;

    return this.sendMessage({ to, body });
  }

  async sendDayOfReminder({ to, seekerName, helperName, time, helperPhone }) {
    const body = `Reminder: ${helperName} arrives today at ${time}.

Helper contact: ${helperPhone}

Need to reschedule? Reply RESCHEDULE or call ${config.app.supportPhone}`;

    return this.sendMessage({ to, body });
  }

  async sendMessage({ to, body, mediaUrl = null }) {
    try {
      const messageParams = {
        from: config.twilio.phoneNumber,
        to,
        body,
      };

      if (mediaUrl) {
        messageParams.mediaUrl = [mediaUrl];
      }

      const message = await twilio.messages.create(messageParams);

      // Log to database
      await supabaseService.logSMS({
        toNumber: to,
        fromNumber: config.twilio.phoneNumber,
        body,
        messageSid: message.sid,
        status: message.status,
      });

      return { success: true, messageSid: message.sid };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleIncomingReply(from, body) {
    const normalizedBody = body.trim().toUpperCase();

    // Find booking by phone
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('seeker_phone', from)
      .order('created_at', { ascending: false })
      .limit(1);

    const booking = bookings?.[0];

    if (normalizedBody === 'HELP') {
      return {
        reply: `Help options:\nPAY - Payment link\nSIGN - E-sign link\nCANCEL - Cancel booking\nCALL - Call support at ${config.app.supportPhone}`,
      };
    }

    if (normalizedBody === 'PAY' && booking) {
      const paymentUrl = `${config.baseUrl}/api/payments/checkout?booking=${booking.id}`;
      return { reply: `Complete payment here: ${paymentUrl}` };
    }

    if (normalizedBody === 'SIGN' && booking) {
      const esignUrl = `${config.baseUrl}/api/esign/request?booking=${booking.id}`;
      return { reply: `Sign your agreement: ${esignUrl}` };
    }

    if (normalizedBody === 'RESCHEDULE') {
      return {
        reply: `To reschedule, please call ${config.app.supportPhone} and we'll find a new time that works for you.`,
      };
    }

    if (normalizedBody === 'CANCEL') {
      if (booking) {
        await supabaseService.updateBookingStatus(booking.id, 'cancelled_by_user');
        return { reply: 'Your booking has been cancelled. You will receive a refund within 5-7 business days.' };
      }
      return { reply: 'No active booking found. Call ${config.app.supportPhone} for assistance.' };
    }

    return {
      reply: `Thanks for your message. A coordinator will respond shortly. For immediate help, call ${config.app.supportPhone}.`,
    };
  }
}

module.exports = new SMSService();