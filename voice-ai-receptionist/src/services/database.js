const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.type = config.database.type;
    
    if (this.type === 'supabase') {
      this.supabase = createClient(
        config.database.supabaseUrl,
        config.database.supabaseKey
      );
    }
  }

  /**
   * Log a call to the database
   */
  async logCall(callData) {
    const {
      vapiCallId,
      callerNumber,
      callerName,
      status,
      startedAt,
      endedAt,
      durationSeconds,
      transcript,
      summary,
      intent,
      appointmentId,
    } = callData;

    if (this.type === 'supabase') {
      const { data, error } = await this.supabase
        .from('calls')
        .insert({
          vapi_call_id: vapiCallId,
          caller_number: callerNumber,
          caller_name: callerName,
          status,
          started_at: startedAt,
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          transcript,
          summary,
          intent,
          appointment_id: appointmentId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // SQLite fallback (console log for now)
    console.log('📞 Call logged:', callData);
    return { id: 'local-' + Date.now(), ...callData };
  }

  /**
   * Store appointment record
   */
  async storeAppointment(appointmentData) {
    const {
      googleEventId,
      callerName,
      callerPhone,
      callerEmail,
      serviceType,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      status = 'scheduled',
      notes,
    } = appointmentData;

    if (this.type === 'supabase') {
      const { data, error } = await this.supabase
        .from('appointments')
        .insert({
          google_event_id: googleEventId,
          caller_name: callerName,
          caller_phone: callerPhone,
          caller_email: callerEmail,
          service_type: serviceType,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration_minutes: durationMinutes,
          status,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    console.log('📅 Appointment stored:', appointmentData);
    return { id: 'local-' + Date.now(), ...appointmentData };
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(googleEventId, status) {
    if (this.type === 'supabase') {
      const { data, error } = await this.supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('google_event_id', googleEventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    console.log('📝 Appointment updated:', { googleEventId, status });
    return { googleEventId, status };
  }

  /**
   * Get call history
   */
  async getCallHistory(limit = 50, offset = 0) {
    if (this.type === 'supabase') {
      const { data, error } = await this.supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    }

    return [];
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limit = 50) {
    if (this.type === 'supabase') {
      const { data, error } = await this.supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    }

    return [];
  }
}

module.exports = new DatabaseService();