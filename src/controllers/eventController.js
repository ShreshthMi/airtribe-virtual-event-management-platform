const eventModel = require('../models/eventModel');
const userModel = require('../models/userModel');
const emailService = require('../services/emailService');
const { validateEventPayload } = require('../utils/validators');

function publicEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    capacity: event.capacity,
    organizerId: event.organizerId,
    participantCount: event.participants.length,
    participants: event.participants,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function listEvents(req, res) {
  const events = eventModel.listEvents().map(publicEvent);
  return res.json({ events });
}

async function getEvent(req, res) {
  const event = eventModel.findEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  return res.json({ event: publicEvent(event) });
}

async function createEvent(req, res, next) {
  try {
    const errors = validateEventPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const event = eventModel.createEvent({
      title: req.body.title.trim(),
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      capacity: req.body.capacity ?? null,
      organizerId: req.user.id,
    });
    return res.status(201).json({ message: 'Event created', event: publicEvent(event) });
  } catch (err) {
    return next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = eventModel.findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can modify this event' });
    }
    const errors = validateEventPayload(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const updated = eventModel.updateEvent(req.params.id, req.body);
    return res.json({ message: 'Event updated', event: publicEvent(updated) });
  } catch (err) {
    return next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = eventModel.findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can delete this event' });
    }
    eventModel.deleteEvent(req.params.id);
    return res.json({ message: 'Event deleted' });
  } catch (err) {
    return next(err);
  }
}

async function registerForEvent(req, res, next) {
  try {
    const event = eventModel.findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const result = eventModel.addParticipant(req.params.id, req.user.id);
    if (!result.ok) {
      if (result.reason === 'already_registered') {
        return res.status(409).json({ error: 'You are already registered for this event' });
      }
      if (result.reason === 'full') {
        return res.status(409).json({ error: 'Event is at full capacity' });
      }
      return res.status(404).json({ error: 'Event not found' });
    }
    const user = userModel.findUserById(req.user.id);
    if (user) {
      emailService.sendEventRegistrationEmail(user, result.event).catch((err) => {
        console.error('Failed to send event registration email:', err.message);
      });
    }
    return res.status(201).json({
      message: 'Registered for event',
      event: publicEvent(result.event),
    });
  } catch (err) {
    return next(err);
  }
}

async function unregisterFromEvent(req, res, next) {
  try {
    const result = eventModel.removeParticipant(req.params.id, req.user.id);
    if (!result.ok) {
      if (result.reason === 'not_found') {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (result.reason === 'not_registered') {
        return res.status(409).json({ error: 'You are not registered for this event' });
      }
    }
    return res.json({ message: 'Unregistered from event', event: publicEvent(result.event) });
  } catch (err) {
    return next(err);
  }
}

async function myRegistrations(req, res) {
  const events = eventModel.eventsForUser(req.user.id).map(publicEvent);
  return res.json({ events });
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  myRegistrations,
};
