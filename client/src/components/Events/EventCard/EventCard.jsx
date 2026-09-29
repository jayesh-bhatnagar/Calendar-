import { useEffect, useState } from 'react';
import {
  formatEventDate,
  formatEventTime,
  hasEventPassed,
  localDateTimeToIso,
  toLocalDateTimeInput,
} from '../../../utils/dateUtils.js';
import './EventCard.css';

function EventCard({ event, isMutating, onEdit, onDelete, onStatusChange, onReschedule }) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newStartAt, setNewStartAt] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const rescheduleFieldId = `reschedule-${event._id}`;
  const isPast = hasEventPassed(event.startAt);
  const displayedStatus = isPast && ['scheduled', 'rescheduled'].includes(event.status)
    ? 'missed'
    : event.status;

  useEffect(() => {
    if (isPast) {
      setIsRescheduling(false);
    }
  }, [isPast]);

  function openRescheduleForm() {
    setNewStartAt(toLocalDateTimeInput(event.startAt));
    setRescheduleError('');
    setIsRescheduling(true);
  }

  async function handleReschedule(submitEvent) {
    submitEvent.preventDefault();
    const isoStartAt = localDateTimeToIso(newStartAt);
    if (!isoStartAt) {
      setRescheduleError('Choose a valid date and time.');
      return;
    }

    try {
      await onReschedule(event, isoStartAt);
      setIsRescheduling(false);
    } catch (error) {
      setRescheduleError(error.message);
    }
  }

  return (
    <article className="event-card">
      <time className="event-time" dateTime={event.startAt}>
        {formatEventTime(event.startAt)}
      </time>
      <div className="event-content">
        <h3>{event.title}</h3>
        {event.description && <p>{event.description}</p>}
        {event.originalStartAt && (
          <p className="original-time">
            Originally {formatEventDate(event.originalStartAt)} at {formatEventTime(event.originalStartAt)}
          </p>
        )}
      </div>
      <span className={`event-status status-${displayedStatus}`}>{displayedStatus}</span>
      <div className="event-actions" aria-label={`Actions for ${event.title}`}>
        {event.status !== 'completed' && (
          <button type="button" onClick={() => onStatusChange(event, 'completed')} disabled={isMutating || isPast}>
            Complete
          </button>
        )}
        {event.status !== 'missed' && (
          <button type="button" onClick={() => onStatusChange(event, 'missed')} disabled={isMutating || isPast}>
            Mark missed
          </button>
        )}
        <button type="button" onClick={openRescheduleForm} disabled={isMutating || isPast}>
          Reschedule
        </button>
        <button type="button" onClick={() => onEdit(event)} disabled={isMutating || isPast}>
          Edit
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(event)}
          disabled={isMutating || isPast}
        >
          Delete
        </button>
      </div>
      {isPast && (
        <p className="event-expired-note" role="status">
          This event has passed. Actions are disabled.
        </p>
      )}
      {isRescheduling && (
        <form className="reschedule-form" onSubmit={handleReschedule}>
          <label htmlFor={rescheduleFieldId}>New date and time</label>
          <input
            id={rescheduleFieldId}
            type="datetime-local"
            value={newStartAt}
            onChange={(changeEvent) => setNewStartAt(changeEvent.target.value)}
            min={toLocalDateTimeInput(new Date(Date.now() + 60000).toISOString())}
            aria-invalid={Boolean(rescheduleError)}
            aria-describedby={rescheduleError ? `${rescheduleFieldId}-error` : undefined}
            required
          />
          {rescheduleError && (
            <p id={`${rescheduleFieldId}-error`} className="reschedule-error" role="alert">
              {rescheduleError}
            </p>
          )}
          <div className="reschedule-actions">
            <button type="submit" disabled={isMutating || isPast}>Save time</button>
            <button type="button" onClick={() => setIsRescheduling(false)} disabled={isMutating || isPast}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export default EventCard;