const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./services/logger');
const calendar = require('./services/calendar');
const database = require('./services/database');
const email = require('./services/email');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/webhook/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * ====================
 * VAPI WEBHOOK HANDLER
 * ====================
 * Main endpoint for Vapi voice AI to call
 */
app.post('/webhook/vapi', async (req, res) => {
  try {
    const { message, call } = req.body;
    
    logger.info('📞 Vapi webhook received', {
      type: message?.type,
      callId: call?.id,
    });

    // Handle different message types
    switch (message?.type) {
      case 'function-call':
        return await handleFunctionCall(req, res);
      
      case 'end-of-call-report':
        return await handleEndOfCall(req, res);
      
      case 'speech-update':
      case 'status-update':
        // Acknowledge but don't process
        return res.json({ status: 'acknowledged' });
      
      default:
        logger.warn('Unknown message type', { type: message?.type });
        return res.json({ status: 'unknown_type' });
    }
  } catch (error) {
    logger.error('Error in webhook handler', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle function calls from Vapi AI
 */
async function handleFunctionCall(req, res) {
  const { message, call } = req.body;
  const { functionCall } = message;
  
  logger.info('🔧 Function call received', {
    name: functionCall.name,
    parameters: functionCall.parameters,
  });

  const { name, parameters } = functionCall;

  try {
    let result;

    switch (name) {
      case 'getAvailableSlots':
        result = await handleGetSlots(parameters);
        break;
      
      case 'bookAppointment':
        result = await handleBookAppointment(parameters, call);
        break;
      
      case 'rescheduleAppointment':
        result = await handleRescheduleAppointment(parameters);
        break;
      
      case 'cancelAppointment':
        result = await handleCancelAppointment(parameters);
        break;
      
      case 'findAppointmentByPhone':
        result = await handleFindByPhone(parameters);
        break;
      
      default:
        return res.status(400).json({
          error: `Unknown function: ${name}`,
        });
    }

    return res.json({
      status: 'success',
      result,
    });
  } catch (error) {
    logger.error('Function call error', { name, error: error.message });
    return res.json({
      status: 'error',
      error: error.message,
    });
  }
}

/**
 * Get available time slots
 */
async function handleGetSlots({ date, duration_minutes = 30 }) {
  if (!date) {
    throw new Error('Date is required');
  }

  const slots = await calendar.getAvailableSlots(date, duration_minutes);
  
  return {
    date,
    available_slots: slots,
    slot_count: slots.length,
  };
}

/**
 * Book a new appointment
 */
async function handleBookAppointment({
  caller_name,
  caller_phone,
  caller_email,
  date,
  time,
  service_type = 'Consultation',
  notes = '',
}, call) {
  // Book in Google Calendar
  const booking = await calendar.bookAppointment({
    callerName: caller_name,
    callerPhone: caller_phone,
    callerEmail: caller_email,
    date,
    time,
    serviceType: service_type,
    notes,
  });

  // Store in database
  await database.storeAppointment({
    googleEventId: booking.eventId,
    callerName: caller_name,
    callerPhone: caller_phone,
    callerEmail: caller_email,
    serviceType: service_type,
    appointmentDate: date,
    appointmentTime: time,
    durationMinutes: config.business.slotDurationMinutes,
    notes,
  });

  // Send confirmation email
  if (caller_email) {
    await email.sendBookingConfirmation({
      to: caller_email,
      callerName: caller_name,
      serviceType: service_type,
      date,
      time,
      calendarLink: booking.htmlLink,
    });
  }

  return {
    success: true,
    appointment_id: booking.eventId,
    date,
    time,
    confirmation_sent: !!caller_email,
  };
}

/**
 * Reschedule an existing appointment
 */
async function handleRescheduleAppointment({
  appointment_id,
  new_date,
  new_time,
  caller_email,
}) {
  // Get old appointment details (would need to fetch from DB or calendar)
  const oldAppointment = await calendar.findAppointmentsByPhone(caller_email); // This needs refinement

  // Update in Google Calendar
  const updated = await calendar.updateAppointment(appointment_id, {
    newDate: new_date,
    newTime: new_time,
  });

  // Update in database
  await database.updateAppointmentStatus(appointment_id, 'rescheduled');

  // Send email notification
  if (caller_email) {
    await email.sendRescheduleConfirmation({
      to: caller_email,
      callerName: oldAppointment[0]?.summary?.split(' - ')[1] || 'Valued Customer',
      newDate: new_date,
      newTime: new_time,
      calendarLink: updated.htmlLink,
    });
  }

  return {
    success: true,
    appointment_id: updated.eventId,
    new_date,
    new_time,
    confirmation_sent: !!caller_email,
  };
}

/**
 * Cancel an appointment
 */
async function handleCancelAppointment({
  appointment_id,
  reason = 'Caller requested cancellation',
  caller_email,
}) {
  // Cancel in Google Calendar
  const cancelled = await calendar.cancelAppointment(appointment_id, reason);

  // Update in database
  await database.updateAppointmentStatus(appointment_id, 'cancelled');

  // Send email notification
  if (caller_email) {
    await email.sendCancellationConfirmation({
      to: caller_email,
      callerName: cancelled.cancelledEvent.summary?.split(' - ')[1] || 'Valued Customer',
      serviceType: cancelled.cancelledEvent.summary?.split(' - ')[0] || 'Appointment',
      date: new Date(cancelled.cancelledEvent.start).toLocaleDateString(),
      time: new Date(cancelled.cancelledEvent.start).toLocaleTimeString(),
      reason,
    });
  }

  return {
    success: true,
    appointment_id,
    reason,
    confirmation_sent: !!caller_email,
  };
}

/**
 * Find appointment by phone number
 */
async function handleFindByPhone({ phone_number }) {
  const appointments = await calendar.findAppointmentsByPhone(phone_number);
  
  return {
    found: appointments.length > 0,
    appointments: appointments.map(appt => ({
      id: appt.id,
      summary: appt.summary,
      date: new Date(appt.start).toLocaleDateString(),
      time: new Date(appt.start).toLocaleTimeString(),
    })),
  };
}

/**
 * Handle end-of-call report
 */
async function handleEndOfCall(req, res) {
  const { call } = req.body;
  
  logger.info('📞 Call ended', {
    callId: call.id,
    duration: call.durationSeconds,
    status: call.status,
  });

  // Log call to database
  await database.logCall({
    vapiCallId: call.id,
    callerNumber: call.customer?.number,
    callerName: call.customer?.name,
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    durationSeconds: call.durationSeconds,
    transcript: call.transcript,
    summary: call.summary,
    intent: call.analysis?.structuredData?.intent || 'unknown',
  });

  return res.json({ status: 'logged' });
}

/**
 * ====================
 * DIRECT API ENDPOINTS
 * ====================
 * For testing and external integrations
 */

// Get available slots
app.post('/slots/available', async (req, res) => {
  try {
    const { date, duration_minutes = 30 } = req.body;
    const slots = await calendar.getAvailableSlots(date, duration_minutes);
    res.json({ date, available_slots: slots });
  } catch (error) {
    logger.error('Error getting slots', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Book appointment
app.post('/slots/book', async (req, res) => {
  try {
    const booking = await calendar.bookAppointment(req.body);
    
    // Store in database
    await database.storeAppointment({
      googleEventId: booking.eventId,
      ...req.body,
    });

    // Send email if provided
    if (req.body.caller_email) {
      await email.sendBookingConfirmation({
        to: req.body.caller_email,
        callerName: req.body.caller_name,
        serviceType: req.body.service_type,
        date: req.body.date,
        time: req.body.time,
        calendarLink: booking.htmlLink,
      });
    }

    res.json(booking);
  } catch (error) {
    logger.error('Error booking appointment', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
app.post('/slots/update', async (req, res) => {
  try {
    const { appointment_id, new_date, new_time } = req.body;
    const updated = await calendar.updateAppointment(appointment_id, {
      newDate: new_date,
      newTime: new_time,
    });
    res.json(updated);
  } catch (error) {
    logger.error('Error updating appointment', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Cancel appointment
app.post('/slots/cancel', async (req, res) => {
  try {
    const { appointment_id, reason } = req.body;
    const cancelled = await calendar.cancelAppointment(appointment_id, reason);
    res.json(cancelled);
  } catch (error) {
    logger.error('Error cancelling appointment', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  logger.info(`🚀 Voice AI Receptionist running on port ${config.port}`);
  logger.info(`📊 Health check: http://localhost:${config.port}/health`);
});

module.exports = app;