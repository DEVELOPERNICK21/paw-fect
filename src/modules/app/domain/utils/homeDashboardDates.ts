/**
 * Date/time helpers for the home dashboard view model (domain layer, pure functions).
 */

/** Exported for record-date parsing in dashboard use case. */
export function parseLocalDay(ymd: string): Date {
  const [yy, mm, dd] = ymd.split('-').map(Number);
  return new Date(yy, (mm ?? 1) - 1, dd ?? 1);
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function reminderDateKey(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function parseFlexibleTimeToMinutes(raw: string): number | null {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  const m12 = compact.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m12) {
    let h = Number(m12[1]);
    const min = Number(m12[2]);
    const ap = m12[3];
    if (h > 12 || min > 59) {
      return null;
    }
    if (ap === 'PM' && h !== 12) {
      h += 12;
    }
    if (ap === 'AM' && h === 12) {
      h = 0;
    }
    return h * 60 + min;
  }
  const m24 = compact.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = Number(m24[1]);
    const min = Number(m24[2]);
    if (h > 23 || min > 59) {
      return null;
    }
    return h * 60 + min;
  }
  return null;
}

export function isReminderTimeInPastForToday(
  dateStr: string,
  timeStr: string,
  now: Date,
): boolean {
  if (reminderDateKey(dateStr) !== toYmd(now)) {
    return false;
  }
  const t = timeStr.trim();
  if (!t || /^all\s*day$/i.test(t)) {
    return false;
  }
  const target = parseFlexibleTimeToMinutes(t);
  if (target == null) {
    return false;
  }
  const cur = now.getHours() * 60 + now.getMinutes();
  return target <= cur;
}

export function daysUntilDate(dateStr: string, now: Date): number {
  const key = reminderDateKey(dateStr);
  const today = toYmd(now);
  const start = parseLocalDay(today).getTime();
  const end = parseLocalDay(key).getTime();
  return Math.round((end - start) / 86_400_000);
}

/** Calendar add for YYYY-MM-DD date keys (local). */
export function addDaysToYmd(ymd: string, days: number): string {
  const d = parseLocalDay(reminderDateKey(ymd));
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function formatMilestoneSubtitle(dateStr: string, now: Date): string {
  const short = parseLocalDay(reminderDateKey(dateStr)).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  );
  const d = daysUntilDate(dateStr, now);
  if (d === 0) {
    return `Today • ${short}`;
  }
  if (d === 1) {
    return `Tomorrow • ${short}`;
  }
  if (d < 0) {
    return `${short}`;
  }
  return `In ${d} days • ${short}`;
}

/** Long form for milestone widget, e.g. "15 Apr 2026". */
export function formatMilestoneDateLong(dateStr: string): string {
  return parseLocalDay(reminderDateKey(dateStr)).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Short badge text for countdown pill, e.g. "in 12 days". */
export function formatMilestoneCountdownBadge(dateStr: string, now: Date): string {
  const d = daysUntilDate(dateStr, now);
  if (d < 0) {
    return 'Overdue';
  }
  if (d === 0) {
    return 'Today';
  }
  if (d === 1) {
    return 'in 1 day';
  }
  return `in ${d} days`;
}
