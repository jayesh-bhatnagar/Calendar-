import { useEffect, useState } from 'react';
import * as eventService from '../services/eventService.js';

function sortEvents(events) {
  return [...events].sort((first, second) => new Date(first.startAt) - new Date(second.startAt));
}

export function useEvents() {
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
        const loadedEvents = await eventService.getEvents({ signal: controller.signal });
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
  }, [reloadCount]);

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
      (currentEvents, updatedEvent) => currentEvents.map((event) => (
        event._id === id ? updatedEvent : event
      )),
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
    deleteEvent,
    clearMutationError,
  };
}