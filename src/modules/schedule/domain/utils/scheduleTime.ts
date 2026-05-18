const MINUTES_PER_DAY = 24 * 60;

export function parseHhMm(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return {
    hours: hours ?? 0,
    minutes: minutes ?? 0,
  };
}

export function formatHhMm(totalMinutes: number): string {
  const normalized =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutes(time: string, deltaMinutes: number): string {
  const { hours, minutes } = parseHhMm(time);
  return formatHhMm(hours * 60 + minutes + deltaMinutes);
}

export function subtractMinutes(time: string, deltaMinutes: number): string {
  return addMinutes(time, -deltaMinutes);
}

export function compareHhMm(a: string, b: string): number {
  const left = parseHhMm(a);
  const right = parseHhMm(b);
  const leftTotal = left.hours * 60 + left.minutes;
  const rightTotal = right.hours * 60 + right.minutes;
  return leftTotal - rightTotal;
}

export function minutesBetweenHhMm(start: string, end: string): number {
  const startMinutes = parseHhMm(start);
  const endMinutes = parseHhMm(end);
  const startTotal = startMinutes.hours * 60 + startMinutes.minutes;
  const endTotal = endMinutes.hours * 60 + endMinutes.minutes;
  return endTotal - startTotal;
}

export function clampHhMm(time: string, min: string, max: string): string {
  if (compareHhMm(time, min) < 0) {
    return min;
  }
  if (compareHhMm(time, max) > 0) {
    return max;
  }
  return time;
}

export function earlierHhMm(a: string, b: string): string {
  return compareHhMm(a, b) <= 0 ? a : b;
}

export function laterHhMm(a: string, b: string): string {
  return compareHhMm(a, b) >= 0 ? a : b;
}

export function monthsBetweenIsoDates(startIso: string, endIso: string): number {
  const [startYear, startMonth, startDay] = startIso.slice(0, 10).split('-').map(Number);
  const [endYear, endMonth, endDay] = endIso.slice(0, 10).split('-').map(Number);
  const start = new Date(startYear, (startMonth ?? 1) - 1, startDay ?? 1);
  const end = new Date(endYear, (endMonth ?? 1) - 1, endDay ?? 1);
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

export function weekdayFromIsoDate(dateIso: string): number {
  const [year, month, day] = dateIso.slice(0, 10).split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getDay();
}

export function dayOfMonthFromIsoDate(dateIso: string): number {
  return Number(dateIso.slice(8, 10));
}
