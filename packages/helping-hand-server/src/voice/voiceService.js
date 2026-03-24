const { Twilio } = require('twilio');
const config = require('../config');
const supabaseService = require('../services/supabase');

const twilio = new Twilio(config.twilio.accountSid, config.twilio.authToken);

class VoiceService {
  /**
   * Generate TwiML for AI voice conversation
   * This connects the call to Vapi AI or handles with Twilio native
   */
  generateVoiceResponse() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! Thank you for calling ${config.app.name}. I'm your AI assistant.</Say>
  <Pause length="1"/>
  <Say>I can help you book help for tasks, find a helper, or answer questions.</Say>
  <Connect>
    <Stream url="wss://api.vapi.ai/twilio/connect">
      <Parameter name="assistantId" value="${process.env.VAPI_ASSISTANT_ID}"/>
    </Stream>
  </Connect>
</Response>`;
  }

  /**
   * Handle Vapi webhook for function calls
   */
  async handleVapiWebhook(payload) {
    const { message, call } = payload;
    
    console.log('📞 Vapi webhook:', { type: message?.type, callId: call?.id });

    switch (message?.type) {
      case 'function-call':
        return await this.handleFunctionCall(message.functionCall, call);
      
      case 'end-of-call-report':
        return await this.handleCallEnd(call);
      
      default:
        return { status: 'acknowledged' };
    }
  }

  async handleFunctionCall(functionCall, call) {
    const { name, parameters } = functionCall;
    
    console.log(`🔧 Function: ${name}`, parameters);

    switch (name) {
      case 'createBookingIntake':
        return await this.createBookingIntake(parameters, call);
      
      case 'findHelpers':
        return await this.findAvailableHelpers(parameters);
      
      case 'confirmBooking':
        return await this.confirmBooking(parameters);
      
      case 'sendSMSConfirmation':
        return await this.sendSMSConfirmation(parameters);
      
      default:
        return { error: `Unknown function: ${name}` };
    }
  }

  async createBookingIntake(params, call) {
    const { 
      caller_name, 
      caller_phone, 
      service_type, 
      description, 
      location, 
      preferred_date, 
      preferred_time,
      budget 
    } = params;

    // Create intake record in database
    const intake = await supabaseService.createVoiceIntake({
      vapiCallId: call.id,
      callerName: caller_name,
      callerPhone: caller_phone || call.customer?.number,
      serviceType: service_type,
      description,
      location,
      preferredDate: preferred_date,
      preferredTime: preferred_time,
      budget: budget ? parseFloat(budget) : null,
      status: 'intake_complete',
      transcript: call.transcript,
    });

    return {
      success: true,
      intakeId: intake.id,
      message: `Great! I've recorded your request for ${service_type}. Let me find available helpers in your area.`,
    };
  }

  async findAvailableHelpers(params) {
    const { location, service_type, preferred_date, preferred_time } = params;

    // Query Supabase for available helpers
    const helpers = await supabaseService.findHelpers({
      location,
      serviceType: service_type,
      date: preferred_date,
      time: preferred_time,
    });

    if (helpers.length === 0) {
      return {
        found: false,
        message: "I don't see any helpers available for that time. Would you like me to suggest alternative times?",
      };
    }

    const helperList = helpers.slice(0, 3).map(h => 
      `${h.name}, ${h.hourly_rate} per hour, rated ${h.rating} stars`
    ).join('; ');

    return {
      found: true,
      helperCount: helpers.length,
      topHelpers: helperList,
      message: `I found ${helpers.length} available helpers. Here are the top 3: ${helperList}. Which would you prefer?`,
    };
  }

  async confirmBooking(params) {
    const { intake_id, helper_id, confirm } = params;

    if (!confirm) {
      return { status: 'cancelled', message: 'No problem, your booking has been cancelled.' };
    }

    // Update intake to confirmed
    const booking = await supabaseService.confirmBooking(intake_id, helper_id);

    return {
      success: true,
      bookingId: booking.id,
      message: `Perfect! Your booking is confirmed. You'll receive a text message with details and a link to complete payment.`,
    };
  }

  async sendSMSConfirmation(params) {
    const { phone, booking_id } = params;

    // Get booking details
    const booking = await supabaseService.getBooking(booking_id);
    
    // Generate links
    const paymentUrl = `${config.baseUrl}/api/payments/checkout?booking=${booking_id}`;
    const esignUrl = `${config.baseUrl}/api/esign/request?booking=${booking_id}`;

    // Send SMS via Twilio
    await twilio.messages.create({
      from: config.twilio.phoneNumber,
      to: phone,
      body: `Hi ${booking.caller_name}! Your ${booking.service_type} booking is confirmed for ${booking.preferred_date} at ${booking.preferred_time}.

Complete payment: ${paymentUrl}
Sign agreement: ${esignUrl}

Questions? Reply here or call ${config.app.supportPhone}`,
    });

    return { success: true, message: 'Confirmation SMS sent' };
  }

  async handleCallEnd(call) {
    // Log call to database
    await supabaseService.logVoiceCall({
      vapiCallId: call.id,
      callerNumber: call.customer?.number,
      durationSeconds: call.durationSeconds,
      transcript: call.transcript,
      summary: call.summary,
      status: call.status,
    });

    return { status: 'logged' };
  }
}

module.exports = new VoiceService();