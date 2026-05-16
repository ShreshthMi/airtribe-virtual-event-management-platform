const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;
const sentMessages = [];

function getTransporter() {
  if (transporter) return transporter;

  if (config.isTest || !config.email.host) {
    if (!config.isTest && !config.email.host) {
      console.warn('[email] SMTP_HOST not set — emails will be captured in memory only and not delivered. Configure SMTP_* env vars to enable real email delivery.');
    }
    transporter = {
      sendMail: async (msg) => {
        sentMessages.push(msg);
        return { accepted: [msg.to], messageId: `mock-${Date.now()}` };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.user
      ? { user: config.email.user, pass: config.email.pass }
      : undefined,
  });
  return transporter;
}

async function sendWelcomeEmail(user) {
  const t = getTransporter();
  const message = {
    from: config.email.from,
    to: user.email,
    subject: 'Welcome to the Virtual Event Management Platform',
    text: `Hi ${user.name},\n\nThanks for registering on the Virtual Event Management Platform. ` +
      `You can now log in, create events, and register as a participant.\n\n— The Events Team`,
    html: `<p>Hi ${user.name},</p>` +
      `<p>Thanks for registering on the Virtual Event Management Platform. ` +
      `You can now log in, create events, and register as a participant.</p>` +
      `<p>— The Events Team</p>`,
  };
  return t.sendMail(message);
}

async function sendEventRegistrationEmail(user, event) {
  const t = getTransporter();
  const message = {
    from: config.email.from,
    to: user.email,
    subject: `You're registered: ${event.title}`,
    text: `Hi ${user.name},\n\nYou are registered for "${event.title}" on ${event.date} at ${event.time}.\n\nSee you there!`,
    html: `<p>Hi ${user.name},</p>` +
      `<p>You are registered for <strong>${event.title}</strong> on ${event.date} at ${event.time}.</p>` +
      `<p>See you there!</p>`,
  };
  return t.sendMail(message);
}

function _getSentMessages() {
  return sentMessages.slice();
}

function _resetSentMessages() {
  sentMessages.length = 0;
}

module.exports = {
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  _getSentMessages,
  _resetSentMessages,
};
