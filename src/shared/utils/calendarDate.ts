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
