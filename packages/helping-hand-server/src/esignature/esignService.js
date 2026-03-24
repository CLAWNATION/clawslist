const axios = require('axios');
const config = require('../config');
const supabaseService = require('../services/supabase');

// Using HelloSign (Dropbox Sign) API for e-signatures
const HELLOSIGN_API_URL = 'https://api.hellosign.com/v3';

class ESignatureService {
  async createSignatureRequest({ bookingId, signerEmail, signerName }) {
    // Get booking details
    const booking = await supabaseService.getBooking(bookingId);

    // Create embedded signature request
    const response = await axios.post(
      `${HELLOSIGN_API_URL}/signature_request/create_embedded`,
      {
        test_mode: config.nodeEnv !== 'production',
        client_id: config.hellosign.clientId,
        subject: `Service Agreement - ${config.app.name}`,
        message: `Please review and sign the service agreement for your ${booking.service_type} booking on ${booking.scheduled_date}.`,
        signers: [{
          email_address: signerEmail || booking.seeker_email,
          name: signerName || booking.seeker_name,
          order: 0,
        }],
        file_urls: [`${config.baseUrl}/templates/service-agreement.pdf`],
        metadata: {
          booking_id: bookingId,
        },
      },
      {
        auth: {
          username: config.hellosign.apiKey,
          password: '',
        },
      }
    );

    const signatureRequest = response.data.signature_request;

    // Get embedded sign URL
    const signatureId = signatureRequest.signatures[0].signature_id;
    const embeddedResponse = await axios.get(
      `${HELLOSIGN_API_URL}/embedded/sign_url/${signatureId}`,
      {
        auth: {
          username: config.hellosign.apiKey,
          password: '',
        },
      }
    );

    // Store signature request in database
    await supabaseService.createSignatureRequest({
      bookingId,
      signatureRequestId: signatureRequest.signature_request_id,
      signerEmail: signerEmail || booking.seeker_email,
      status: 'sent',
    });

    return {
      signatureRequestId: signatureRequest.signature_request_id,
      signUrl: embeddedResponse.data.embedded.sign_url,
      expiresAt: embeddedResponse.data.embedded.expires_at,
    };
  }

  async handleWebhook(event) {
    const { event_type, signature_request } = event;

    switch (event_type) {
      case 'signature_request_signed':
        await this.handleSigned(signature_request);
        break;
      
      case 'signature_request_declined':
        await this.handleDeclined(signature_request);
        break;
      
      case 'signature_request_sent':
        await this.handleSent(signature_request);
        break;
    }

    return { received: true, event: event_type };
  }

  async handleSigned(signatureRequest) {
    const bookingId = signatureRequest.metadata?.booking_id;
    
    if (bookingId) {
      await supabaseService.updateBookingStatus(bookingId, 'signed', {
        signed_at: new Date().toISOString(),
        signature_request_id: signatureRequest.signature_request_id,
      });

      // Send payment link via SMS
      const smsService = require('../sms/smsService');
      const booking = await supabaseService.getBooking(bookingId);
      
      await smsService.sendPaymentReminder({
        to: booking.seeker_phone,
        seekerName: booking.seeker_name,
        bookingId,
        amount: booking.budget || 100,
      });
    }
  }

  async handleDeclined(signatureRequest) {
    const bookingId = signatureRequest.metadata?.booking_id;
    
    if (bookingId) {
      await supabaseService.updateBookingStatus(bookingId, 'signature_declined');
    }
  }

  async handleSent(signatureRequest) {
    console.log('Signature request sent:', signatureRequest.signature_request_id);
  }
}

module.exports = new ESignatureService();