function parseDob(dob: string | undefined): Date | null {
  if (!dob?.trim()) {
    return null;
  }
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole calendar months between two local dates (day-of-month aware). */
function monthsBetweenCalendar(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

export function formatPetAgeLabel(dob: string | undefined, now = new Date()): string {
  const birthDate = parseDob(dob);
  if (!birthDate) {
    return 'Not set';
  }

  if (birthDate.getTime() > now.getTime()) {
    return 'Not set';
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = now.getTime() - birthDate.getTime();

  const monthsTotal = monthsBetweenCalendar(birthDate, now);
  if (monthsTotal >= 12) {
    const years = Math.floor(monthsTotal / 12);
    return years === 1 ? '1 Year Old' : `${years} Years Old`;
  }

  if (monthsTotal >= 1) {
    return monthsTotal === 1 ? '1 Month Old' : `${monthsTotal} Months Old`;
  }

  const weeks = Math.floor(diffMs / msPerWeek);
  if (weeks >= 1) {
    return weeks === 1 ? '1 Week Old' : `${weeks} Weeks Old`;
  }

  return 'Less than a week old';
}

/**
 * Compact age formatter for the share card (e.g. "2 yrs 4 mo", "6 mo", "3 wks").
 * Returns null when dob is missing, future, or invalid so callers can drop the
 * age line entirely instead of printing a fallback like "Not set".
 */
export function formatPetAgeShareLabel(
  dob: string | undefined,
  now = new Date(),
): string | null {
  const birth = parseDob(dob);
  if (!birth) {
    return null;
  }
  if (birth.getTime() > now.getTime()) {
    return null;
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const monthsTotal = monthsBetweenCalendar(birth, now);

  if (monthsTotal >= 12) {
    const years = Math.floor(monthsTotal / 12);
    const months = monthsTotal % 12;
    const yLabel = years === 1 ? '1 yr' : `${years} yrs`;
    if (months === 0) {
      return yLabel;
    }
    return `${yLabel} ${months} mo`;
  }

  if (monthsTotal >= 1) {
    return `${monthsTotal} mo`;
  }

  const weeks = Math.floor((now.getTime() - birth.getTime()) / msPerWeek);
  if (weeks >= 1) {
    return weeks === 1 ? '1 wk' : `${weeks} wks`;
  }

  return null;
}

export function formatPetBirthdayLabel(dob: string | undefined): string {
  const birthDate = parseDob(dob);
  if (!birthDate) {
    return '—';
  }

  return birthDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

