import { useState } from 'react';
import Calendar from '../Calendar/Calendar.jsx';
import EventForm from '../Events/EventForm/EventForm.jsx';
import EventList from '../Events/EventList/EventList.jsx';
import { useEvents } from '../../hooks/useEvents.js';
import {
  formatEventDate,
  getCalendarMonthRange,
  getEventDateKey,
} from '../../utils/dateUtils.js';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const monthRange = getCalendarMonthRange(visibleMonth);
  const {
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
  } = useEvents(monthRange);
  const [editingEvent, setEditingEvent] = useState(null);
  const [notice, setNotice] = useState('');
  const selectedDateKey = getEventDateKey(selectedDate);
  const selectedDayEvents = events.filter((event) => (
    getEventDateKey(event.startAt) === selectedDateKey
  ));

  function selectDate(date) {
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function selectEventDate(value) {
    const date = new Date(value);
    selectDate(date);
  }

  function navigateMonth(offset) {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(selectedDate.getDate(), lastDay),
    );
    setVisibleMonth(nextMonth);
    setSelectedDate(nextSelectedDate);
  }

  function selectToday() {
    selectDate(new Date());
  }

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
      selectEventDate(eventData.startAt);
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
    selectEventDate(event.startAt);
    setEditingEvent(event);
    document.getElementById('event-title')?.focus();
  }

  function handleCancelEdit() {
    setEditingEvent(null);
    clearMutationError();
  }

  async function handleStatusChange(event, status) {
    setNotice('');
    clearMutationError();
    try {
      await updateEventStatus(event._id, status);
      setNotice(status === 'completed' ? 'Event marked completed.' : 'Event marked missed.');
    } catch {
      // The hook exposes a message for the page to display.
    }
  }

  async function handleReschedule(event, startAt) {
    setNotice('');
    clearMutationError();
    await rescheduleEvent(event._id, startAt);
    selectEventDate(startAt);
    setNotice('Event rescheduled.');
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

      <div className="workspace-layout">
        <div className="calendar-column">
          <Calendar
            month={visibleMonth}
            selectedDate={selectedDate}
            events={events}
            isLoading={isLoading}
            onSelectDate={selectDate}
            onPreviousMonth={() => navigateMonth(-1)}
            onNextMonth={() => navigateMonth(1)}
            onToday={selectToday}
          />

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

          <section className="selected-day-section" aria-labelledby="selected-day-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Selected day</p>
                <h2 id="selected-day-heading">{formatEventDate(selectedDate)}</h2>
              </div>
              <span className="event-count" aria-label={`${selectedDayEvents.length} events`}>
                {selectedDayEvents.length.toString().padStart(2, '0')}
              </span>
            </div>

            {isLoading ? (
              <p className="loading-state" role="status">Loading events...</p>
            ) : selectedDayEvents.length > 0 ? (
              <EventList
                events={selectedDayEvents}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onReschedule={handleReschedule}
                isMutating={isMutating}
                showDateHeadings={false}
              />
            ) : !loadError ? (
              <div className="empty-state">
                <p>No events on this day.</p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => document.getElementById('event-title')?.focus()}
                >
                  Add an event
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="form-rail" aria-label={editingEvent ? 'Edit event' : 'Add an event'}>
          <EventForm
            event={editingEvent}
            selectedDate={selectedDate}
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