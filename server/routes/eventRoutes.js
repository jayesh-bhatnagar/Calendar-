const express = require('express');
const { getDatabaseStatus } = require('../config/db');
const {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  rescheduleEvent,
  updateEventStatus,
  updateEvent,
} = require('../controllers/eventController');

const router = express.Router();

router.use((request, response, next) => {
  if (getDatabaseStatus() !== 'connected') {
    return response.status(503).json({ message: 'Database unavailable.' });
  }

  next();
});

router.route('/').get(getEvents).post(createEvent);
router.patch('/:id/status', updateEventStatus);
router.patch('/:id/reschedule', rescheduleEvent);
router.route('/:id').get(getEvent).put(updateEvent).delete(deleteEvent);

module.exports = router;