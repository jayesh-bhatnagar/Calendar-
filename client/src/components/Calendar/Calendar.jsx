import { getCalendarDays, getEventDateKey } from '../../utils/dateUtils.js';
import CalendarDay from './CalendarDay/CalendarDay.jsx';
import CalendarHeader from './CalendarHeader/CalendarHeader.jsx';
import './Calendar.css';

const weekDays = [
  ['Sunday', 'Sun'],
  ['Monday', 'Mon'],
  ['Tuesday', 'Tue'],
  ['Wednesday', 'Wed'],
  ['Thursday', 'Thu'],
  ['Friday', 'Fri'],
  ['Saturday', 'Sat'],
];

function Calendar({
  month,
  selectedDate,
  events,
  isLoading,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}) {
  const today = new Date();
  const days = getCalendarDays(month);
  const eventCounts = new Map();

  for (const event of events) {
    const dateKey = getEventDateKey(event.startAt);
    eventCounts.set(dateKey, (eventCounts.get(dateKey) || 0) + 1);
  }

  return (
    <section className="calendar-panel" aria-label="Monthly calendar" aria-busy={isLoading}>
      <CalendarHeader
        month={month}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
      <div className="calendar-grid" role="grid" aria-label="Calendar days">
        <div className="calendar-weekdays" role="row">
          {weekDays.map(([fullName, shortName]) => (
            <div className="calendar-weekday" role="columnheader" key={fullName}>
              <span aria-hidden="true">{shortName}</span>
              <span className="visually-hidden">{fullName}</span>
            </div>
          ))}
        </div>
        {Array.from({ length: days.length / 7 }, (_, weekIndex) => (
          <div className="calendar-week" role="row" key={weekIndex}>
            {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((date) => (
              <div className="calendar-cell" role="gridcell" key={date.toISOString()}>
                <CalendarDay
                  date={date}
                  currentMonth={month}
                  selectedDate={selectedDate}
                  today={today}
                  eventCount={eventCounts.get(getEventDateKey(date)) || 0}
                  onSelect={onSelectDate}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Calendar;