const { v4: uuidv4 } = require('uuid');

const events = [];

function createEvent({ title, description, date, time, capacity, organizerId }) {
  const event = {
    id: uuidv4(),
    title,
    description: description || '',
    date,
    time,
    capacity: typeof capacity === 'number' ? capacity : null,
    organizerId,
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  events.push(event);
  return event;
}

function findEventById(id) {
  return events.find((e) => e.id === id) || null;
}

function listEvents() {
  return events.slice();
}

function updateEvent(id, updates) {
  const event = findEventById(id);
  if (!event) return null;
  const allowed = ['title', 'description', 'date', 'time', 'capacity'];
  allowed.forEach((key) => {
    if (updates[key] !== undefined) {
      event[key] = updates[key];
    }
  });
  event.updatedAt = new Date().toISOString();
  return event;
}

function deleteEvent(id) {
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  events.splice(idx, 1);
  return true;
}

function addParticipant(eventId, userId) {
  const event = findEventById(eventId);
  if (!event) return { ok: false, reason: 'not_found' };
  if (event.participants.includes(userId)) {
    return { ok: false, reason: 'already_registered' };
  }
  if (event.capacity !== null && event.participants.length >= event.capacity) {
    return { ok: false, reason: 'full' };
  }
  event.participants.push(userId);
  event.updatedAt = new Date().toISOString();
  return { ok: true, event };
}

function removeParticipant(eventId, userId) {
  const event = findEventById(eventId);
  if (!event) return { ok: false, reason: 'not_found' };
  const idx = event.participants.indexOf(userId);
  if (idx === -1) return { ok: false, reason: 'not_registered' };
  event.participants.splice(idx, 1);
  event.updatedAt = new Date().toISOString();
  return { ok: true, event };
}

function eventsForUser(userId) {
  return events.filter((e) => e.participants.includes(userId));
}

function _reset() {
  events.length = 0;
}

module.exports = {
  createEvent,
  findEventById,
  listEvents,
  updateEvent,
  deleteEvent,
  addParticipant,
  removeParticipant,
  eventsForUser,
  _reset,
};
