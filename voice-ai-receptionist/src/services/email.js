const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    
    if (config.email.host && config.email.user) {
      this.transporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation({
    to,
    callerName,
    serviceType,
    date,
    time,
    calendarLink,
  }) {
    if (!this.transporter) {
      console.warn('⚠️  Email not configured');
      return { sent: false, reason: 'Email not configured' };
    }

    const { business } = config;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `✅ Appointment Confirmed - ${business.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Appointment Confirmed</h2>
          <p>Hello ${callerName},</p>
          <p>Your appointment with ${business.name} has been confirmed.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${calendarLink ? `<p><a href="${calendarLink}" style="color: #0066cc;">Add to Calendar</a></p>` : ''}
          </div>
          
          <p>If you need to reschedule or cancel, please call us back or reply to this email.</p>
          
          <p>Best regards,<br>${business.name} Team</p>
        </div>
      `,
      text: `
Hello ${callerName},

Your appointment with ${business.name} has been confirmed.

Appointment Details:
- Service: ${serviceType}
- Date: ${date}
- Time: ${time}
${calendarLink ? `- Calendar: ${calendarLink}` : ''}

If you need to reschedule or cancel, please call us back or reply to this email.

Best regards,
${business.name} Team
      `,
    };

    const result = await this.transporter.sendMail(mailOptions);
    return { sent: true, messageId: result.messageId };
  }

  /**
   * Send rescheduling confirmation
   */
  async sendRescheduleConfirmation({
    to,
    callerName,
    serviceType,
    oldDate,
    oldTime,
    newDate,
    newTime,
    calendarLink,
  }) {
    if (!this.transporter) {
      console.warn('⚠️  Email not configured');
      return { sent: false, reason: 'Email not configured' };
    }

    const { business } = config;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `🔄 Appointment Rescheduled - ${business.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Appointment Rescheduled</h2>
          <p>Hello ${callerName},</p>
          <p>Your appointment with ${business.name} has been rescheduled.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Previous:</strong> ${oldDate} at ${oldTime}</p>
          </div>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">New Appointment Details</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Date:</strong> ${newDate}</p>
            <p><strong>Time:</strong> ${newTime}</p>
            ${calendarLink ? `<p><a href="${calendarLink}" style="color: #0066cc;">Add to Calendar</a></p>` : ''}
          </div>
          
          <p>If you need to make further changes, please call us back.</p>
          
          <p>Best regards,<br>${business.name} Team</p>
        </div>
      `,
      text: `
Hello ${callerName},

Your appointment with ${business.name} has been rescheduled.

Previous: ${oldDate} at ${oldTime}

New Appointment Details:
- Service: ${serviceType}
- Date: ${newDate}
- Time: ${newTime}
${calendarLink ? `- Calendar: ${calendarLink}` : ''}

If you need to make further changes, please call us back.

Best regards,
${business.name} Team
      `,
    };

    const result = await this.transporter.sendMail(mailOptions);
    return { sent: true, messageId: result.messageId };
  }

  /**
   * Send cancellation confirmation
   */
  async sendCancellationConfirmation({
    to,
    callerName,
    serviceType,
    date,
    time,
    reason,
  }) {
    if (!this.transporter) {
      console.warn('⚠️  Email not configured');
      return { sent: false, reason: 'Email not configured' };
    }

    const { business } = config;

    const mailOptions = {
      from: config.email.from,
      to,
      subject: `❌ Appointment Cancelled - ${business.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Appointment Cancelled</h2>
          <p>Hello ${callerName},</p>
          <p>Your appointment with ${business.name} has been cancelled.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Cancelled Appointment</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>If you'd like to book a new appointment, please call us back.</p>
          
          <p>Best regards,<br>${business.name} Team</p>
        </div>
      `,
      text: `
Hello ${callerName},

Your appointment with ${business.name} has been cancelled.

Cancelled Appointment:
- Service: ${serviceType}
- Date: ${date}
- Time: ${time}
${reason ? `- Reason: ${reason}` : ''}

If you'd like to book a new appointment, please call us back.

Best regards,
${business.name} Team
      `,
    };

    const result = await this.transporter.sendMail(mailOptions);
    return { sent: true, messageId: result.messageId };
  }
}

module.exports = new EmailService();