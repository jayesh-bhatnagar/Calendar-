import { formatMonthYear } from '../../../utils/dateUtils.js';
import './CalendarHeader.css';

function CalendarHeader({ month, onPreviousMonth, onNextMonth, onToday }) {
  return (
    <header className="calendar-header">
      <div>
        <p className="eyebrow">Monthly view</p>
        <h2>{formatMonthYear(month)}</h2>
      </div>
      <nav className="calendar-navigation" aria-label="Calendar navigation">
        <button type="button" onClick={onPreviousMonth} aria-label="Previous month" title="Previous month">
          <span aria-hidden="true">&lt;</span>
        </button>
        <button className="today-button" type="button" onClick={onToday}>Today</button>
        <button type="button" onClick={onNextMonth} aria-label="Next month" title="Next month">
          <span aria-hidden="true">&gt;</span>
        </button>
      </nav>
    </header>
  );
}

export default CalendarHeader;