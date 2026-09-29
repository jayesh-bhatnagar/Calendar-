const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDatabase } = require('../config/db');
const Event = require('../models/Event');

let server;
let baseUrl;

before(async () => {
  await connectDatabase();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/events`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

test('creates, reads, updates, filters, and deletes an event', async () => {
  let eventId;

  try {
    const startAt = new Date(Date.now() + 60000).toISOString();
    const dateFilter = startAt.slice(0, 10);
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '  API integration test  ',
        description: 'Temporary event created by the test.',
        startAt,
      }),
    });
    const createdEvent = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createdEvent.title, 'API integration test');
    assert.equal(createdEvent.status, 'scheduled');
    eventId = createdEvent._id;

    const listResponse = await fetch(`${baseUrl}?start=${dateFilter}&end=${dateFilter}`);
    const events = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.ok(events.some((event) => event._id === eventId));

    const getResponse = await fetch(`${baseUrl}/${eventId}`);
    assert.equal(getResponse.status, 200);
    assert.equal((await getResponse.json())._id, eventId);

    const updateResponse = await fetch(`${baseUrl}/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated API integration test',
        description: 'Updated description.',
        startAt,
      }),
    });
    const updatedEvent = await updateResponse.json();
    assert.equal(updateResponse.status, 200);
    assert.equal(updatedEvent.title, 'Updated API integration test');

    const deleteResponse = await fetch(`${baseUrl}/${eventId}`, { method: 'DELETE' });
    assert.equal(deleteResponse.status, 204);
    eventId = null;

    const missingResponse = await fetch(`${baseUrl}/${createdEvent._id}`);
    assert.equal(missingResponse.status, 404);
  } finally {
    if (eventId) {
      await Event.deleteOne({ _id: eventId });
    }
  }
});

test('rejects invalid event data and IDs', async () => {
  const malformedJsonResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformedJsonResponse.status, 400);

  const invalidEventResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: ' ', startAt: 'not-a-date' }),
  });
  assert.equal(invalidEventResponse.status, 400);

  const invalidIdResponse = await fetch(`${baseUrl}/not-an-object-id`);
  assert.equal(invalidIdResponse.status, 400);

  const invalidFilterResponse = await fetch(`${baseUrl}?start=2026-02-30`);
  assert.equal(invalidFilterResponse.status, 400);
});

test('updates event status and preserves the original time when rescheduled', async () => {
  let eventId;

  try {
    const originalStartAt = '2027-01-15T18:00:00.000Z';
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Status API test', startAt: originalStartAt }),
    });
    const createdEvent = await createResponse.json();
    assert.equal(createResponse.status, 201);
    eventId = createdEvent._id;

    const completedResponse = await fetch(`${baseUrl}/${eventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(completedResponse.status, 200);
    assert.equal((await completedResponse.json()).status, 'completed');

    const missedResponse = await fetch(`${baseUrl}/${eventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'missed' }),
    });
    assert.equal(missedResponse.status, 200);
    assert.equal((await missedResponse.json()).status, 'missed');

    const invalidStatusResponse = await fetch(`${baseUrl}/${eventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'unknown' }),
    });
    assert.equal(invalidStatusResponse.status, 400);

    const newStartAt = '2027-01-20T20:30:00.000Z';
    const rescheduleResponse = await fetch(`${baseUrl}/${eventId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startAt: newStartAt }),
    });
    const rescheduledEvent = await rescheduleResponse.json();
    assert.equal(rescheduleResponse.status, 200);
    assert.equal(rescheduledEvent.status, 'rescheduled');
    assert.equal(new Date(rescheduledEvent.startAt).toISOString(), newStartAt);
    assert.equal(new Date(rescheduledEvent.originalStartAt).toISOString(), originalStartAt);

    const secondStartAt = '2027-01-22T17:00:00.000Z';
    const secondRescheduleResponse = await fetch(`${baseUrl}/${eventId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startAt: secondStartAt }),
    });
    const secondReschedule = await secondRescheduleResponse.json();
    assert.equal(secondRescheduleResponse.status, 200);
    assert.equal(new Date(secondReschedule.startAt).toISOString(), secondStartAt);
    assert.equal(new Date(secondReschedule.originalStartAt).toISOString(), originalStartAt);
  } finally {
    if (eventId) {
      await Event.deleteOne({ _id: eventId });
    }
  }
});

test('marks expired events missed and blocks changes after their start time', async () => {
  let eventId;
  let pastEventId;

  try {
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Expired event API test',
        startAt: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    const createdEvent = await createResponse.json();
    assert.equal(createResponse.status, 201);
    eventId = createdEvent._id;

    await Event.updateOne(
      { _id: eventId },
      { $set: { startAt: new Date(Date.now() - 1000) } },
    );

    const getResponse = await fetch(`${baseUrl}/${eventId}`);
    const expiredEvent = await getResponse.json();
    assert.equal(getResponse.status, 200);
    assert.equal(expiredEvent.status, 'missed');

    const statusResponse = await fetch(`${baseUrl}/${eventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(statusResponse.status, 409);

    const editResponse = await fetch(`${baseUrl}/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Should remain locked',
        startAt: new Date(Date.now() + 60000).toISOString(),
      }),
    });
    assert.equal(editResponse.status, 409);

    const rescheduleResponse = await fetch(`${baseUrl}/${eventId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startAt: new Date(Date.now() + 120000).toISOString() }),
    });
    assert.equal(rescheduleResponse.status, 409);

    const deleteResponse = await fetch(`${baseUrl}/${eventId}`, { method: 'DELETE' });
    assert.equal(deleteResponse.status, 409);

    const pastCreateResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Past event creation test',
        startAt: new Date(Date.now() - 60000).toISOString(),
      }),
    });
    const pastEvent = await pastCreateResponse.json();
    assert.equal(pastCreateResponse.status, 201);
    assert.equal(pastEvent.status, 'missed');
    pastEventId = pastEvent._id;
  } finally {
    if (eventId) {
      await Event.deleteOne({ _id: eventId });
    }
    if (pastEventId) {
      await Event.deleteOne({ _id: pastEventId });
    }
  }
});