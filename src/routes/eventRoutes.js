const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', eventController.listEvents);
router.get('/me/registrations', authenticate, eventController.myRegistrations);
router.get('/:id', eventController.getEvent);

router.post('/', authenticate, requireRole('organizer'), eventController.createEvent);
router.put('/:id', authenticate, requireRole('organizer'), eventController.updateEvent);
router.delete('/:id', authenticate, requireRole('organizer'), eventController.deleteEvent);

router.post('/:id/register', authenticate, eventController.registerForEvent);
router.delete('/:id/register', authenticate, eventController.unregisterFromEvent);

module.exports = router;
