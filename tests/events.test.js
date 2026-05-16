const request = require('supertest');
const { buildApp, resetState, registerUser, registerOrganizer } = require('./helpers');

let app;
let organizerToken;
let attendeeToken;
let secondOrganizerToken;

const sampleEvent = {
  title: 'Future of Web Dev',
  description: 'A virtual talk on the future of web development.',
  date: '2030-08-15',
  time: '18:30',
  capacity: 100,
};

beforeEach(async () => {
  resetState();
  app = buildApp();
  const organizer = await registerOrganizer(app, { email: 'organizer@example.com' });
  organizerToken = organizer.res.body.token;
  const attendee = await registerUser(app, { email: 'attendee@example.com' });
  attendeeToken = attendee.res.body.token;
  const other = await registerOrganizer(app, { email: 'organizer2@example.com' });
  secondOrganizerToken = other.res.body.token;
});

describe('POST /events', () => {
  test('organizer can create an event', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({
      title: sampleEvent.title,
      date: sampleEvent.date,
      time: sampleEvent.time,
    });
    expect(res.body.event.id).toBeDefined();
  });

  test('attendee cannot create an event', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send(sampleEvent);
    expect(res.status).toBe(403);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).post('/events').send(sampleEvent);
    expect(res.status).toBe(401);
  });

  test('rejects invalid payload', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ title: '', date: 'bad', time: '99:99' });
    expect(res.status).toBe(400);
  });
});

describe('GET /events', () => {
  test('lists events publicly', async () => {
    await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBe(1);
  });

  test('GET /events/:id returns the event', async () => {
    const create = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    const res = await request(app).get(`/events/${create.body.event.id}`);
    expect(res.status).toBe(200);
    expect(res.body.event.id).toBe(create.body.event.id);
  });

  test('GET /events/:id returns 404 for missing event', async () => {
    const res = await request(app).get('/events/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('PUT /events/:id', () => {
  let eventId;

  beforeEach(async () => {
    const create = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    eventId = create.body.event.id;
  });

  test('organizer can update their own event', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Updated Title');
  });

  test('a different organizer cannot update the event', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${secondOrganizerToken}`)
      .send({ title: 'Hijack' });
    expect(res.status).toBe(403);
  });

  test('attendee cannot update event', async () => {
    const res = await request(app)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ title: 'Nope' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /events/:id', () => {
  test('organizer can delete their own event', async () => {
    const create = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    const res = await request(app)
      .delete(`/events/${create.body.event.id}`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
    const listRes = await request(app).get('/events');
    expect(listRes.body.events.length).toBe(0);
  });

  test('different organizer cannot delete event', async () => {
    const create = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(sampleEvent);
    const res = await request(app)
      .delete(`/events/${create.body.event.id}`)
      .set('Authorization', `Bearer ${secondOrganizerToken}`);
    expect(res.status).toBe(403);
  });
});
