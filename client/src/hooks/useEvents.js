import { useEffect, useState } from 'react';
import * as eventService from '../services/eventService.js';
import { hasEventPassed } from '../utils/dateUtils.js';

function sortEvents(events) {
  return [...events].sort((first, second) => new Date(first.startAt) - new Date(second.startAt));
}

export function useEvents({ startAt, endAt } = {}) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setIsLoading(true);
      setLoadError('');

      try {
        const loadedEvents = await eventService.getEvents({
          signal: controller.signal,
          startAt,
          endAt,
        });
        setEvents(sortEvents(loadedEvents));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();
    return () => controller.abort();
  }, [reloadCount, startAt, endAt]);

  useEffect(() => {
    const nextExpiration = events.reduce((nextTime, event) => {
      if (!['scheduled', 'rescheduled'].includes(event.status)) {
        return nextTime;
      }

      const eventTime = new Date(event.startAt).getTime();
      if (Number.isNaN(eventTime)) {
        return nextTime;
      }

      return Math.min(nextTime, eventTime);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(nextExpiration)) {
      return undefined;
    }

    const delay = Math.max(0, Math.min(nextExpiration - Date.now() + 25, 2147483647));
    const timeoutId = setTimeout(() => {
      setReloadCount((count) => count + 1);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [events]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (!document.hidden) {
        setReloadCount((count) => count + 1);
      }
    }

    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => document.removeEventListener('visibilitychange', refreshWhenVisible);
  }, []);

  function retry() {
    setReloadCount((count) => count + 1);
  }

  function clearMutationError() {
    setMutationError('');
  }

  async function runMutation(operation, updateEvents) {
    setIsMutating(true);
    setMutationError('');

    try {
      const result = await operation();
      setEvents((currentEvents) => sortEvents(updateEvents(currentEvents, result)));
      return result;
    } catch (error) {
      setMutationError(error.message);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  function createEvent(data) {
    return runMutation(
      () => eventService.createEvent(data),
      (currentEvents, createdEvent) => [...currentEvents, createdEvent],
    );
  }

  function updateEvent(id, data) {
    return runMutation(
      () => eventService.updateEvent(id, data),
      (currentEvents, updatedEvent) => currentEvents
        .map((event) => (event._id === id ? updatedEvent : event))
        .filter((event) => {
          const eventTime = new Date(event.startAt).getTime();
          return (!startAt || eventTime >= new Date(startAt).getTime())
            && (!endAt || eventTime <= new Date(endAt).getTime());
        }),
    );
  }

  function updateEventStatus(id, status) {
    return runMutation(
      () => eventService.updateEventStatus(id, status),
      (currentEvents, updatedEvent) => currentEvents.map((event) => (
        event._id === id ? updatedEvent : event
      )),
    );
  }

  function rescheduleEvent(id, nextStartAt) {
    return runMutation(
      () => eventService.rescheduleEvent(id, nextStartAt),
      (currentEvents, updatedEvent) => currentEvents
        .map((event) => (event._id === id ? updatedEvent : event))
        .filter((event) => {
          const eventTime = new Date(event.startAt).getTime();
          return (!startAt || eventTime >= new Date(startAt).getTime())
            && (!endAt || eventTime <= new Date(endAt).getTime());
        }),
    );
  }

  function deleteEvent(id) {
    return runMutation(
      () => eventService.deleteEvent(id),
      (currentEvents) => currentEvents.filter((event) => event._id !== id),
    );
  }

  return {
    events,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    retry,
    createEvent,
    updateEvent,
    updateEventStatus,
    rescheduleEvent,
    deleteEvent,
    clearMutationError,
  };
}