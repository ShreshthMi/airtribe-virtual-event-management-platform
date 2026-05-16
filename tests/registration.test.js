const request = require('supertest');
const { buildApp, resetState, registerUser, registerOrganizer } = require('./helpers');
const emailService = require('../src/services/emailService');

let app;
let organizerToken;
let attendeeToken;
let secondAttendeeToken;
let eventId;

beforeEach(async () => {
  resetState();
  app = buildApp();
  const organizer = await registerOrganizer(app, { email: 'organizer@example.com' });
  organizerToken = organizer.res.body.token;
  const attendee = await registerUser(app, { email: 'attendee@example.com' });
  attendeeToken = attendee.res.body.token;
  const attendee2 = await registerUser(app, { email: 'attendee2@example.com' });
  secondAttendeeToken = attendee2.res.body.token;

  const create = await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: 'Capacity Limited',
      description: 'Only one seat',
      date: '2030-09-01',
      time: '10:00',
      capacity: 1,
    });
  eventId = create.body.event.id;
  emailService._resetSentMessages();
});

describe('POST /events/:id/register', () => {
  test('authenticated user can register for an event', async () => {
    const res = await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(201);
    expect(res.body.event.participantCount).toBe(1);
  });

  test('sends a confirmation email on registration', async () => {
    await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    await new Promise((r) => setImmediate(r));
    const sent = emailService._getSentMessages();
    expect(sent.some((m) => m.to === 'attendee@example.com' && /registered/i.test(m.subject))).toBe(true);
  });

  test('rejects duplicate registration', async () => {
    await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    const res = await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(409);
  });

  test('rejects registration when event is full', async () => {
    await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    const res = await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${secondAttendeeToken}`);
    expect(res.status).toBe(409);
  });

  test('unauthenticated registration is rejected', async () => {
    const res = await request(app).post(`/events/${eventId}/register`);
    expect(res.status).toBe(401);
  });

  test('returns 404 for missing event', async () => {
    const res = await request(app)
      .post('/events/no-such-id/register')
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /events/me/registrations', () => {
  test('lists events the user is registered for', async () => {
    await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    const res = await request(app)
      .get('/events/me/registrations')
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
    expect(res.body.events[0].id).toBe(eventId);
  });
});

describe('DELETE /events/:id/register', () => {
  test('user can unregister from an event', async () => {
    await request(app)
      .post(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    const res = await request(app)
      .delete(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.event.participantCount).toBe(0);
  });

  test('returns 409 when not registered', async () => {
    const res = await request(app)
      .delete(`/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    expect(res.status).toBe(409);
  });
});
