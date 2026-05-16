# Virtual Event Management Platform — Backend

A RESTful Node.js / Express backend for managing virtual events. Users can register, log in, create events (as an organizer), and register as participants. All data is stored in memory using plain JavaScript arrays and objects — no database is required.

**Live API:** https://airtribe-virtual-event-management.onrender.com

Quick liveness check: [`GET /health`](https://airtribe-virtual-event-management.onrender.com/health) returns `{"status":"ok"}`. (On Render's free tier, the bare `/` path is intercepted by their edge — use `/health` or any of the API endpoints below to verify the service is up.)

## Features

- User registration and login with **bcryptjs** password hashing and **JWT** session tokens.
- Two roles: `organizer` (can create/update/delete events) and `attendee` (can register for events).
- Event CRUD endpoints, restricted to the event's organizer for mutating operations.
- Participant management: register, unregister, list capacity-aware participants.
- Welcome email on user registration and confirmation email on event registration, sent asynchronously through **nodemailer**.
- In-memory data store with a clean reset hook to make testing straightforward.
- Jest + supertest integration tests covering authentication, event CRUD, authorization, and registration flows.

## Project Structure

```
.
├── server.js                 # Entry point
├── src/
│   ├── app.js                # Express app factory
│   ├── config/config.js      # Env-based configuration
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth & error middleware
│   ├── models/               # In-memory data stores (users, events)
│   ├── routes/               # Express routers
│   ├── services/             # Email service (nodemailer)
│   └── utils/validators.js   # Request payload validation
├── tests/                    # Jest + supertest test suites
├── package.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env` and adjust as needed. All values have sensible defaults, so the server runs without an `.env` file in development.

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `JWT_SECRET` | Secret used to sign JWTs. Required outside `development` / `test` — the server will throw on startup if missing in production. |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor (default `10`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | SMTP credentials for outgoing emails |
| `EMAIL_FROM` | `From:` header for outgoing emails |

If `SMTP_HOST` is empty, the email service falls back to an in-memory mock transport — handy for development and tests. Outside of `NODE_ENV=test`, the server logs a warning at startup so misconfiguration in production is visible rather than silent.

### Run

```bash
npm start          # production
npm run dev        # with nodemon
```

The server listens on `http://localhost:3000`.

### Test

```bash
npm run test
```

All test suites should pass:

```
Test Suites: 4 passed, 4 total
Tests:       43 passed, 43 total
```

## Deployment

A live instance is hosted on Render's free tier at **https://airtribe-virtual-event-management.onrender.com** and is the simplest way to try the API without cloning the repo.

### Required environment variables on Render

Set these under **Environment → Add Environment Variable** when creating the Web Service (or for an existing service, under the **Environment** tab):

| Key | Value |
| --- | --- |
| `JWT_SECRET` | A long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. The server refuses to boot in production without it. |
| `NODE_ENV` | `production` |

Optional — only needed if you want real email delivery instead of the in-memory mock transport: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

Render injects `PORT` automatically; the server reads it via `process.env.PORT`. No `Procfile`, `render.yaml`, or secret files are required — regular environment variables cover all configuration.

### Build and start commands

Render auto-detects a Node.js project and uses:
- **Build command:** `npm install`
- **Start command:** `npm start`

No overrides needed.

### Free-tier caveats

- **Cold starts.** Render's free tier puts a service to sleep after ~15 minutes of inactivity. The first request after a sleep takes roughly **30–60 seconds** to wake the instance — subsequent requests are fast. If a graded request appears to hang, retry once after a minute.
- **In-memory state is ephemeral.** Every redeploy, sleep, or crash wipes all users, events, and registrations. This is consistent with the brief's "in-memory data structures" requirement; if you need persistence, swap the in-memory models in [`src/models/`](src/models/) for a real database without touching the routes/controllers.
- **No real emails by default.** With SMTP vars unset, the email service falls back to an in-memory mock and logs a one-time startup warning in the Render service logs. The API still returns `201` on registration and `201` on event registration — the email codepath runs end-to-end against the mock transport.

## API Reference

All request and response bodies are JSON. Authenticated routes expect an `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/register` (alias: `/users/signup`) | Public | Register a new user (`organizer` or `attendee`). Sends a welcome email. |
| `POST` | `/login` (alias: `/users/login`) | Public | Log in with email/password; returns a JWT. |
| `GET` | `/me` | Bearer | Return the current user's profile. |

#### `POST /register`

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "organizer"          // optional, defaults to "attendee"
}
```

Response `201`:
```json
{
  "message": "User registered successfully",
  "user": { "id": "…", "name": "Alice", "email": "alice@example.com", "role": "organizer", "createdAt": "…" },
  "token": "<JWT>"
}
```

#### `POST /login`

```json
{ "email": "alice@example.com", "password": "secret123" }
```

Returns the same shape as `/register` minus the welcome email.

### Events

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/events` | Public | List events. Supports pagination via `?page=` and `?pageSize=`. |
| `GET` | `/events/:id` | Public | Get a single event. |
| `POST` | `/events` | Organizer | Create a new event. |
| `PUT` | `/events/:id` | Organizer (owner) | Update fields of an event you own. |
| `DELETE` | `/events/:id` | Organizer (owner) | Delete an event you own. |
| `POST` | `/events/:id/register` | Bearer | Register the current user as a participant. Sends a confirmation email. |
| `DELETE` | `/events/:id/register` | Bearer | Unregister the current user. |
| `GET` | `/events/me/registrations` | Bearer | List events the current user is registered for. |

#### `POST /events`

```json
{
  "title": "Future of Web Dev",
  "description": "Virtual talk on web tech.",
  "date": "2030-08-15",
  "time": "18:30",
  "capacity": 100
}
```

`date` must be `YYYY-MM-DD`, `time` must be `HH:MM`, `capacity` is optional (omit or set `null` for unlimited).

#### `GET /events?page=1&pageSize=20`

Both query params are optional. Defaults: `page=1`, `pageSize=20`. `pageSize` is capped at `100`. Invalid values fall back to defaults.

Response:
```json
{
  "events": [ /* ... */ ],
  "pagination": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
}
```

#### Event object

```json
{
  "id": "…",
  "title": "Future of Web Dev",
  "description": "…",
  "date": "2030-08-15",
  "time": "18:30",
  "capacity": 100,
  "organizerId": "…",
  "participantCount": 3,
  "participants": ["userId1", "userId2", "userId3"],
  "createdAt": "…",
  "updatedAt": "…"
}
```

## Authorization Rules

- `POST/PUT/DELETE /events` require the user to have role `organizer`.
- `PUT/DELETE /events/:id` additionally require the authenticated user to be the original creator (`organizerId === user.id`).
- `POST/DELETE /events/:id/register` require any authenticated user.

## Error Format

All errors return JSON in the form `{ "error": "<message>" }` with an appropriate HTTP status code.

| Status | Meaning |
| --- | --- |
| 400 | Validation error / malformed JSON |
| 401 | Missing/invalid token |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, full event, already registered, etc.) |
| 500 | Unexpected server error |

## Notes

- All data lives in process memory; restarting the server clears all users and events.
- Email sending is fire-and-forget: registration responses don't block on SMTP delivery.
- The Jest suite uses a mock email transport, so tests run with no network calls.
# airtribe-virtual-event-management-platform
