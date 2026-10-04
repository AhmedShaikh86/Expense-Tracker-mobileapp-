/**
 * Date helpers.
 *
 * Expense dates are stored as local 'YYYY-MM-DD' strings. Using plain strings
 * (instead of timestamps) means an expense added at 11pm never "moves" to
 * another day because of time zones, and strings sort correctly in SQL.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date object -> 'YYYY-MM-DD' (local time). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'YYYY-MM-DD' -> Date object at local midnight. */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** 'YYYY-MM' key for a date, e.g. '2026-09'. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** First and last day of the month containing `date`, as ISO strings. */
export function monthRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Returns a new Date moved by `count` months (day set to 1 to avoid overflow). */
export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** 'September 2026' */
export function formatMonthLong(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** '2026-09' -> 'Sep' */
export function formatMonthShort(key: string): string {
  const [, m] = key.split('-').map(Number);
  return MONTHS[m - 1];
}

/** '2026-09-27' -> '27 Sep 2026' */
export function formatDate(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Friendly section title: 'Today', 'Yesterday' or 'Mon, 21 Sep 2026'. */
export function formatDateHeading(iso: string): string {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (iso === toISODate(today)) return 'Today';
  if (iso === toISODate(yesterday)) return 'Yesterday';
  const d = parseISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${formatDate(iso)}`;
}

/** Ordinal suffix for recurring days: 1 -> '1st', 22 -> '22nd'. */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function nowTimestamp(): string {
  return new Date().toISOString();
}
