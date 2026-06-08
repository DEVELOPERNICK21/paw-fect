function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Calendar date (YYYY-MM-DD) in the user's **local timezone**.
 * Use this for UI date pickers and user-entered health events to avoid
 * "selected today but treated as tomorrow/yesterday" issues.
 */
export function getTodayIsoDateLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Calendar date (YYYY-MM-DD) derived from UTC.
 * Use this only for server/UTC-based flows where "same absolute instant"
 * must map to the same date globally.
 */
export function getTodayIsoDateUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Whole calendar days between two YYYY-MM-DD strings using UTC date parts (no local TZ drift on DST boundaries).
 */
export function calendarDaysBetweenIsoDates(fromIso: string, toIso: string): number {
  const from = fromIso.slice(0, 10);
  const to = toIso.slice(0, 10);
  const [y0, m0, d0] = from.split('-').map(Number);
  const [y1, m1, d1] = to.split('-').map(Number);
  const t0 = Date.UTC(y0, (m0 ?? 1) - 1, d0 ?? 1);
  const t1 = Date.UTC(y1, (m1 ?? 1) - 1, d1 ?? 1);
  return Math.round((t1 - t0) / 86400000);
}

/**
 * Checks if a Date object is valid (not "Invalid Date").
 */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Safely converts a Date object to an ISO string.
 * Returns null if the date is invalid, null, or undefined.
 */
export function safeToIsoString(d: Date | null | undefined): string | null {
  return isValidDate(d) ? d.toISOString() : null;
}
