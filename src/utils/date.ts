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

export function isAfterToday(dateStr: string): boolean {
  return dateStr > formatLocalDate(new Date());
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

export function nowLocalIso(now: Date = new Date()): string {
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

/**
 * Formats time string or Date into 24-hour "HH:MM" format.
 * Guarantees 24-hour format regardless of user locale.
 */
export function formatTime24(val?: string | Date | null): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const match = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/.exec(trimmed);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(d);
    }
    return trimmed;
  }
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(val);
}

/**
 * Validates whether string is in HH:MM 24-hour format (00:00 to 23:59).
 */
export function isValidTime24(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim());
}

/**
 * Normalizes input time string like "8:30" or "8:5" into 2-digit "08:30" or "08:05".
 */
export function normalizeTime24(val: string): string {
  const trimmed = val.trim();
  const match = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/.exec(trimmed);
  if (!match) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
}
