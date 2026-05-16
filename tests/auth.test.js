const request = require('supertest');
const { buildApp, resetState } = require('./helpers');
const emailService = require('../src/services/emailService');

let app;

beforeEach(() => {
  resetState();
  app = buildApp();
});

describe('POST /register', () => {
  test('registers a new user and returns a JWT', async () => {
    const res = await request(app).post('/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
      role: 'organizer',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      role: 'organizer',
    });
    expect(res.body.user).not.toHaveProperty('password');
    expect(typeof res.body.token).toBe('string');
  });

  test('sends a welcome email on successful registration', async () => {
    await request(app).post('/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'secret123',
    });
    // Allow the fire-and-forget email promise to resolve
    await new Promise((r) => setImmediate(r));
    const sent = emailService._getSentMessages();
    expect(sent.length).toBe(1);
    expect(sent[0].to).toBe('bob@example.com');
    expect(sent[0].subject).toMatch(/welcome/i);
  });

  test('rejects duplicate email', async () => {
    await request(app).post('/register').send({
      name: 'Alice',
      email: 'dup@example.com',
      password: 'secret123',
    });
    const res = await request(app).post('/register').send({
      name: 'Alice2',
      email: 'dup@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(409);
  });

  test('rejects invalid payload', async () => {
    const res = await request(app).post('/register').send({
      email: 'not-an-email',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /login', () => {
  beforeEach(async () => {
    await request(app).post('/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('rejects wrong password', async () => {
    const res = await request(app).post('/login').send({
      email: 'login@example.com',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app).post('/login').send({
      email: 'unknown@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /me', () => {
  test('returns current user with valid token', async () => {
    const reg = await request(app).post('/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    });
    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  test('rejects request without token', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });
});
