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

export function getEvents({ signal, startAt, endAt } = {}) {
  const query = new URLSearchParams();
  if (startAt) {
    query.set('start', startAt);
  }
  if (endAt) {
    query.set('end', endAt);
  }

  const queryString = query.toString();
  const path = queryString ? `${eventsPath}?${queryString}` : eventsPath;
  return request(path, { signal });
}

export function createEvent(data) {
  return sendJson(eventsPath, 'POST', data);
}

export function updateEvent(id, data) {
  return sendJson(`${eventsPath}/${encodeURIComponent(id)}`, 'PUT', data);
}

export function updateEventStatus(id, status) {
  return sendJson(`${eventsPath}/${encodeURIComponent(id)}/status`, 'PATCH', { status });
}

export function rescheduleEvent(id, startAt) {
  return sendJson(`${eventsPath}/${encodeURIComponent(id)}/reschedule`, 'PATCH', { startAt });
}

export function deleteEvent(id) {
  return request(`${eventsPath}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}