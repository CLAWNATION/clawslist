const { google } = require('googleapis');
const config = require('../config');

class CalendarService {
  constructor() {
    this.auth = null;
    this.calendar = null;
    this.init();
  }

  init() {
    if (!config.google.serviceAccount) {
      console.warn('⚠️  Google Service Account not configured');
      return;
    }

    this.auth = new google.auth.GoogleAuth({
      credentials: config.google.serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(date, durationMinutes = 30) {
    if (!this.calendar) throw new Error('Calendar not initialized');

    const { calendarId } = config.google;
    const { businessHoursStart, businessHoursEnd } = config.business;

    // Parse date and set business hours
    const startOfDay = new Date(`${date}T${businessHoursStart}:00`);
    const endOfDay = new Date(`${date}T${businessHoursEnd}:00`);

    // Get existing events
    const response = await this.calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const existingEvents = response.data.items || [];

    // Generate all possible slots
    const slots = [];
    const slotDuration = durationMinutes * 60 * 1000; // ms
    let currentSlot = startOfDay.getTime();
    const endTime = endOfDay.getTime();

    while (currentSlot + slotDuration <= endTime) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot + slotDuration);

      // Check if slot conflicts with existing events
      const isAvailable = !existingEvents.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return (slotStart < eventEnd && slotEnd > eventStart);
      });

      if (isAvailable) {
        slots.push(slotStart.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }));
      }

      currentSlot += slotDuration;
    }

    return slots;
  }

  /**
   * Book a new appointment
   */
  async bookAppointment({
    callerName,
    callerPhone,
    callerEmail,
    date,
    time,
    serviceType = 'Appointment',
    durationMinutes = 30,
    notes = '',
  }) {
    if (!this.calendar) throw new Error('Calendar not initialized');

    const { calendarId } = config.google;

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const event = {
      summary: `${serviceType} - ${callerName}`,
      description: `Caller: ${callerName}\nPhone: ${callerPhone}\nEmail: ${callerEmail || 'N/A'}\n\nNotes: ${notes}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: config.business.timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: config.business.timezone,
      },
      attendees: callerEmail ? [{ email: callerEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 30 }, // 30 min before
        ],
      },
    };

    const response = await this.calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: callerEmail ? 'all' : 'none',
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
    };
  }

  /**
   * Update/reschedule an appointment
   */
  async updateAppointment(eventId, { newDate, newTime, durationMinutes = 30 }) {
    if (!this.calendar) throw new Error('Calendar not initialized');

    const { calendarId } = config.google;

    // Get existing event
    const existing = await this.calendar.events.get({
      calendarId,
      eventId,
    });

    const startTime = new Date(`${newDate}T${newTime}:00`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const updatedEvent = {
      ...existing.data,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: config.business.timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: config.business.timezone,
      },
    };

    const response = await this.calendar.events.update({
      calendarId,
      eventId,
      resource: updatedEvent,
      sendUpdates: 'all',
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
    };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(eventId, reason = '') {
    if (!this.calendar) throw new Error('Calendar not initialized');

    const { calendarId } = config.google;

    // Get event details before deleting
    const event = await this.calendar.events.get({
      calendarId,
      eventId,
    });

    // Cancel (delete) the event
    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });

    return {
      success: true,
      cancelledEvent: {
        id: event.data.id,
        summary: event.data.summary,
        start: event.data.start?.dateTime,
        reason,
      },
    };
  }

  /**
   * Find appointment by phone number (for rescheduling/cancelling)
   */
  async findAppointmentsByPhone(phoneNumber, daysAhead = 30) {
    if (!this.calendar) throw new Error('Calendar not initialized');

    const { calendarId } = config.google;
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const response = await this.calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      q: phoneNumber, // Search in event content
    });

    return (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime,
      end: event.end?.dateTime,
      description: event.description,
    }));
  }
}

module.exports = new CalendarService();