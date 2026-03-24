const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

class SupabaseService {
  async createVoiceIntake(data) {
    const { data: intake, error } = await supabase
      .from('voice_intakes')
      .insert({
        vapi_call_id: data.vapiCallId,
        caller_name: data.callerName,
        caller_phone: data.callerPhone,
        service_type: data.serviceType,
        description: data.description,
        location: data.location,
        preferred_date: data.preferredDate,
        preferred_time: data.preferredTime,
        budget: data.budget,
        status: data.status,
        transcript: data.transcript,
      })
      .select()
      .single();

    if (error) throw error;
    return intake;
  }

  async findHelpers({ location, serviceType, date, time }) {
    // Query helpers available for this service type and time
    const { data: helpers, error } = await supabase
      .from('helper_profiles')
      .select('*, users(name, phone)')
      .contains('services', [serviceType])
      .eq('is_available', true)
      .limit(10);

    if (error) throw error;
    return helpers || [];
  }

  async confirmBooking(intakeId, helperId) {
    // Get intake
    const { data: intake } = await supabase
      .from('voice_intakes')
      .select('*')
      .eq('id', intakeId)
      .single();

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        voice_intake_id: intakeId,
        helper_id: helperId,
        seeker_name: intake.caller_name,
        seeker_phone: intake.caller_phone,
        service_type: intake.service_type,
        description: intake.description,
        location: intake.location,
        scheduled_date: intake.preferred_date,
        scheduled_time: intake.preferred_time,
        budget: intake.budget,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (error) throw error;
    return booking;
  }

  async getBooking(bookingId) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return booking;
  }

  async logVoiceCall(data) {
    const { error } = await supabase
      .from('voice_calls')
      .insert({
        vapi_call_id: data.vapiCallId,
        caller_number: data.callerNumber,
        duration_seconds: data.durationSeconds,
        transcript: data.transcript,
        summary: data.summary,
        status: data.status,
      });

    if (error) console.error('Failed to log voice call:', error);
  }

  async updateBookingStatus(bookingId, status, updates = {}) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, ...updates, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new SupabaseService();