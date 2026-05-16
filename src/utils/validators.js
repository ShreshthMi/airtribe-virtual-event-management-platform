const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validateRegister(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is required'];
  }
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (!body.email || !EMAIL_RE.test(body.email)) {
    errors.push('valid email is required');
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
    errors.push('password must be at least 6 characters');
  }
  if (body.role && !['organizer', 'attendee'].includes(body.role)) {
    errors.push('role must be "organizer" or "attendee"');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is required'];
  }
  if (!body.email || !EMAIL_RE.test(body.email)) {
    errors.push('valid email is required');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('password is required');
  }
  return errors;
}

function validateEventPayload(body, { partial = false } = {}) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body is required'];
  }
  if (!partial || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('title is required');
    }
  }
  if (!partial || body.date !== undefined) {
    if (!body.date || !DATE_RE.test(body.date)) {
      errors.push('date must be in YYYY-MM-DD format');
    }
  }
  if (!partial || body.time !== undefined) {
    if (!body.time || !TIME_RE.test(body.time)) {
      errors.push('time must be in HH:MM format');
    }
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }
  if (body.capacity !== undefined && body.capacity !== null) {
    if (typeof body.capacity !== 'number' || body.capacity < 1 || !Number.isInteger(body.capacity)) {
      errors.push('capacity must be a positive integer');
    }
  }
  return errors;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateEventPayload,
};
