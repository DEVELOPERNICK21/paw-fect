/**
 * Parse reminder date (YYYY-MM-DD) and time (`09:00 AM` or `14:30`) in local timezone.
 */
export function parseReminderLocalDateTime(
  dateYmd: string,
  timeStr: string,
): Date | null {
  const parts = dateYmd.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    return null;
  }
  const [y, mo, d] = parts;
  const t = timeStr.trim();
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let hour = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toUpperCase();
    if (ap === 'PM' && hour !== 12) {
      hour += 12;
    }
    if (ap === 'AM' && hour === 12) {
      hour = 0;
    }
    return new Date(y, mo - 1, d, hour, min, 0, 0);
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hour = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    return new Date(y, mo - 1, d, hour, min, 0, 0);
  }
  return null;
}

export function isFutureReminderDateTime(
  dateYmd: string,
  timeStr: string,
  now: Date = new Date(),
): boolean {
  const event = parseReminderLocalDateTime(dateYmd, timeStr);
  if (event == null) {
    return false;
  }
  return event.getTime() > now.getTime() + 1500;
}
