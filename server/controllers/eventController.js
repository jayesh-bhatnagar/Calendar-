const mongoose = require('mongoose');
const Event = require('../models/Event');

function validateBody(body, allowedFields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }

  const unsupportedField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unsupportedField) {
    return `Unsupported field: ${unsupportedField}.`;
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return 'Title is required and must be a non-empty string.';
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'Description must be a string.';
  }

  if (typeof body.startAt !== 'string' || !body.startAt.trim() || Number.isNaN(Date.parse(body.startAt))) {
    return 'Start time must be a valid date/time string.';
  }

  return null;
}

function parseDateFilter(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isDateTime = /^\d{4}-\d{2}-\d{2}T/.test(value);
  if (!isDateOnly && !isDateTime) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const datePart = value.slice(0, 10);
  const calendarDate = new Date(`${datePart}T00:00:00.000Z`);
  if (calendarDate.toISOString().slice(0, 10) !== datePart) {
    return null;
  }

  return { date, isDateOnly };
}

function sendError(error, response) {
  if (error.name === 'ValidationError') {
    return response.status(400).json({
      message: 'Event data is invalid.',
      errors: Object.values(error.errors).map(({ path, message }) => ({ field: path, message })),
    });
  }

  if (error.name === 'CastError') {
    return response.status(400).json({ message: `${error.path} is invalid.` });
  }

  console.error('Event request failed.', error);
  return response.status(500).json({ message: 'An unexpected error occurred.' });
}

function isValidEventId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

async function getEvents(request, response) {
  const start = request.query.start === undefined ? null : parseDateFilter(request.query.start);
  const end = request.query.end === undefined ? null : parseDateFilter(request.query.end);

  if ((request.query.start !== undefined && !start) || (request.query.end !== undefined && !end)) {
    return response.status(400).json({
      message: 'Start and end filters must be valid ISO dates or date/time values.',
    });
  }

  if (start && end) {
    const endOfDate = end.isDateOnly ? end.date.getTime() + 86400000 - 1 : end.date.getTime();
    if (start.date.getTime() > endOfDate) {
      return response.status(400).json({ message: 'Start filter must not be after end filter.' });
    }
  }

  const startAt = {};
  if (start) {
    startAt.$gte = start.date;
  }
  if (end) {
    if (end.isDateOnly) {
      const dayAfterEnd = new Date(end.date);
      dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);
      startAt.$lt = dayAfterEnd;
    } else {
      startAt.$lte = end.date;
    }
  }

  const filter = Object.keys(startAt).length ? { startAt } : {};

  try {
    const events = await Event.find(filter).sort({ startAt: 1 });
    return response.status(200).json(events);
  } catch (error) {
    return sendError(error, response);
  }
}

async function getEvent(request, response) {
  if (!isValidEventId(request.params.id)) {
    return response.status(400).json({ message: 'Event ID is invalid.' });
  }

  try {
    const event = await Event.findById(request.params.id);
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' });
    }

    return response.status(200).json(event);
  } catch (error) {
    return sendError(error, response);
  }
}

async function createEvent(request, response) {
  const validationMessage = validateBody(request.body, ['title', 'description', 'startAt']);
  if (validationMessage) {
    return response.status(400).json({ message: validationMessage });
  }

  try {
    const event = await Event.create({
      title: request.body.title,
      description: request.body.description,
      startAt: request.body.startAt,
    });
    return response.status(201).json(event);
  } catch (error) {
    return sendError(error, response);
  }
}

async function updateEvent(request, response) {
  if (!isValidEventId(request.params.id)) {
    return response.status(400).json({ message: 'Event ID is invalid.' });
  }

  const validationMessage = validateBody(request.body, ['title', 'description', 'startAt']);
  if (validationMessage) {
    return response.status(400).json({ message: validationMessage });
  }

  try {
    const event = await Event.findById(request.params.id);
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' });
    }

    event.title = request.body.title;
    event.description = request.body.description || '';
    event.startAt = request.body.startAt;
    await event.save();
    return response.status(200).json(event);
  } catch (error) {
    return sendError(error, response);
  }
}

async function deleteEvent(request, response) {
  if (!isValidEventId(request.params.id)) {
    return response.status(400).json({ message: 'Event ID is invalid.' });
  }

  try {
    const event = await Event.findByIdAndDelete(request.params.id);
    if (!event) {
      return response.status(404).json({ message: 'Event not found.' });
    }

    return response.status(204).end();
  } catch (error) {
    return sendError(error, response);
  }
}

module.exports = { createEvent, deleteEvent, getEvent, getEvents, updateEvent };