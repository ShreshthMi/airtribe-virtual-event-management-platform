const request = require('supertest');
const createApp = require('../src/app');
const userModel = require('../src/models/userModel');
const eventModel = require('../src/models/eventModel');
const emailService = require('../src/services/emailService');

function buildApp() {
  return createApp();
}

function resetState() {
  userModel._reset();
  eventModel._reset();
  emailService._resetSentMessages();
}

async function registerUser(app, overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'password123',
    role: 'attendee',
    ...overrides,
  };
  const res = await request(app).post('/register').send(payload);
  return { res, payload };
}

async function registerOrganizer(app, overrides = {}) {
  return registerUser(app, { role: 'organizer', name: 'Organizer', ...overrides });
}

module.exports = {
  buildApp,
  resetState,
  registerUser,
  registerOrganizer,
};
