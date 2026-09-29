import EventCard from '../EventCard/EventCard.jsx';
import { formatEventDate, getEventDateKey } from '../../../utils/dateUtils.js';
import './EventList.css';

function EventList({
  events,
  isMutating,
  onEdit,
  onDelete,
  onStatusChange,
  onReschedule,
  showDateHeadings = true,
}) {
  const eventsByDate = new Map();

  for (const event of events) {
    const dateKey = getEventDateKey(event.startAt);
    const dayEvents = eventsByDate.get(dateKey) || [];
    dayEvents.push(event);
    eventsByDate.set(dateKey, dayEvents);
  }

  return (
    <div className="event-list">
      {[...eventsByDate.entries()].map(([dateKey, dayEvents]) => (
        <section className="event-day-group" key={dateKey}>
          {showDateHeadings && (
            <h3 className="event-day-heading">{formatEventDate(dayEvents[0].startAt)}</h3>
          )}
          {dayEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isMutating={isMutating}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onReschedule={onReschedule}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

export default EventList;