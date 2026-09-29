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
    const startAt = new Date().toISOString();
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