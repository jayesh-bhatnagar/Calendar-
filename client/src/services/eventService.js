const eventsPath = '/api/events';

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(path, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Could not reach the calendar API. Check that the backend is running.');
  }

  let responseData = null;
  if (response.status !== 204) {
    responseData = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(responseData?.message || `The request failed with status ${response.status}.`);
  }

  return responseData;
}

function sendJson(path, method, data) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getEvents(options = {}) {
  return request(eventsPath, options);
}

export function createEvent(data) {
  return sendJson(eventsPath, 'POST', data);
}

export function updateEvent(id, data) {
  return sendJson(`${eventsPath}/${encodeURIComponent(id)}`, 'PUT', data);
}

export function deleteEvent(id) {
  return request(`${eventsPath}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}