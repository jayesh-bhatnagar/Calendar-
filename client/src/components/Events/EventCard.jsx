import { formatEventTime } from '../../utils/dateUtils.js';

function EventCard({ event, isMutating, onEdit, onDelete }) {
  return (
    <article className="event-card">
      <time className="event-time" dateTime={event.startAt}>
        {formatEventTime(event.startAt)}
      </time>
      <div className="event-content">
        <h3>{event.title}</h3>
        {event.description && <p>{event.description}</p>}
      </div>
      <span className={`event-status status-${event.status}`}>{event.status}</span>
      <div className="event-actions" aria-label={`Actions for ${event.title}`}>
        <button type="button" onClick={() => onEdit(event)} disabled={isMutating}>
          Edit
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(event)}
          disabled={isMutating}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default EventCard;