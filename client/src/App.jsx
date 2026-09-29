import { useState } from 'react';
import EventForm from './components/Events/EventForm.jsx';
import EventList from './components/Events/EventList.jsx';
import { useEvents } from './hooks/useEvents.js';

function App() {
  const {
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
  } = useEvents();
  const [editingEvent, setEditingEvent] = useState(null);
  const [notice, setNotice] = useState('');

  async function handleSave(eventData) {
    setNotice('');
    clearMutationError();

    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, eventData);
        setNotice('Event updated.');
      } else {
        await createEvent(eventData);
        setNotice('Event added.');
      }
      setEditingEvent(null);
    } catch {
      // The hook exposes a message for the page to display.
    }
  }

  async function handleDelete(event) {
    const confirmed = window.confirm(`Delete "${event.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setNotice('');
    clearMutationError();
    try {
      await deleteEvent(event._id);
      if (editingEvent?._id === event._id) {
        setEditingEvent(null);
      }
      setNotice('Event deleted.');
    } catch {
      // The hook exposes a message for the page to display.
    }
  }

  function handleEdit(event) {
    setNotice('');
    clearMutationError();
    setEditingEvent(event);
    document.getElementById('event-title')?.focus();
  }

  function handleCancelEdit() {
    setEditingEvent(null);
    clearMutationError();
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Calendar home">
          <span className="wordmark-mark" aria-hidden="true" />
          Calendar
        </a>
        <span className="milestone-label">Event planner</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Your plans, in one place</p>
        <h1 id="page-title">Make time<br />for what matters.</h1>
        <p className="intro-copy">
          Keep the details close. Add an event, or find one you already have in
          mind.
        </p>
      </section>

      <div className="workspace-layout">
        <section className="event-section" aria-labelledby="events-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your schedule</p>
              <h2 id="events-heading">All events</h2>
            </div>
            <span className="event-count" aria-label={`${events.length} events`}>
              {events.length.toString().padStart(2, '0')}
            </span>
          </div>

          {notice && <p className="notice-banner" role="status">{notice}</p>}

          {loadError && (
            <div className="error-banner" role="alert">
              <p>{loadError}</p>
              <button className="text-button" onClick={retry} type="button">
                Try again
              </button>
            </div>
          )}

          {mutationError && <p className="error-banner" role="alert">{mutationError}</p>}

          {isLoading ? (
            <p className="loading-state" role="status">Loading your events...</p>
          ) : events.length > 0 ? (
            <EventList
              events={events}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isMutating={isMutating}
            />
          ) : !loadError ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">+</span>
              <h3>No events yet</h3>
              <p>Your next plan can start with a title and a time.</p>
            </div>
          ) : null}
        </section>

        <aside className="form-rail" aria-label={editingEvent ? 'Edit event' : 'Add an event'}>
          <EventForm
            event={editingEvent}
            isSubmitting={isMutating}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
          />
        </aside>
      </div>

      <footer className="page-footer">
        <span>Calendar</span>
        <span>One plan at a time</span>
      </footer>
    </main>
  );
}

export default App;