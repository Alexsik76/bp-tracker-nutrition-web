export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatLocalDate(new Date());
}

const MONTHS_UK = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

const WEEKDAYS_SHORT_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function formatFriendlyDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDate();
  const month = MONTHS_UK[d.getMonth()];
  const weekday = WEEKDAYS_SHORT_UK[d.getDay()];

  if (isToday(dateStr)) {
    return `Сьогодні, ${day} ${month}`;
  }

  const yesterday = addDays(formatLocalDate(new Date()), -1);
  if (dateStr === yesterday) {
    return `Вчора, ${day} ${month}`;
  }

  const tomorrow = addDays(formatLocalDate(new Date()), 1);
  if (dateStr === tomorrow) {
    return `Завтра, ${day} ${month}`;
  }

  return `${weekday}, ${day} ${month}`;
}

export function nowLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}
