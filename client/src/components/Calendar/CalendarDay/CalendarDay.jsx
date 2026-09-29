import { formatEventDate } from '../../../utils/dateUtils.js';
import './CalendarDay.css';

function CalendarDay({ date, currentMonth, selectedDate, today, eventCount, onSelect }) {
  const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
    && date.getFullYear() === currentMonth.getFullYear();
  const isSelected = date.toDateString() === selectedDate.toDateString();
  const isToday = date.toDateString() === today.toDateString();
  const accessibleLabel = `${formatEventDate(date)}${eventCount ? `, ${eventCount} events` : ''}`;

  return (
    <button
      className={[
        'calendar-day',
        !isCurrentMonth && 'outside-month',
        isSelected && 'selected-day',
        isToday && 'today-day',
      ].filter(Boolean).join(' ')}
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      onClick={() => onSelect(date)}
    >
      <span className="day-number">{date.getDate()}</span>
      <span className="day-events" aria-hidden="true">
        {eventCount > 0 && <span className="day-event-count">{eventCount}</span>}
      </span>
    </button>
  );
}

export default CalendarDay;