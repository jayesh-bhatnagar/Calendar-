export function toLocalDateTimeInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function localDateTimeToIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function hasEventPassed(value, now = Date.now()) {
  const eventTime = new Date(value).getTime();
  return !Number.isNaN(eventTime) && eventTime <= now;
}

export function getCalendarDays(month) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cellCount = Math.ceil((firstDayOfMonth.getDay() + lastDayOfMonth.getDate()) / 7) * 7;
  const firstGridDate = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstDayOfMonth.getDay(),
  );

  return Array.from({ length: cellCount }, (_, index) => (
    new Date(firstGridDate.getFullYear(), firstGridDate.getMonth(), firstGridDate.getDate() + index)
  ));
}

export function getCalendarMonthRange(month) {
  const days = getCalendarDays(month);
  const firstDay = days[0];
  const dayAfterLast = new Date(
    days.at(-1).getFullYear(),
    days.at(-1).getMonth(),
    days.at(-1).getDate() + 1,
  );

  return {
    startAt: firstDay.toISOString(),
    endAt: new Date(dayAfterLast.getTime() - 1).toISOString(),
  };
}

export function toLocalDateTimeInputForDay(date, hour = 9) {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
  return toLocalDateTimeInput(localDate.toISOString());
}

export function formatMonthYear(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

export function getEventDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'unknown-date';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatEventDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatEventTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}