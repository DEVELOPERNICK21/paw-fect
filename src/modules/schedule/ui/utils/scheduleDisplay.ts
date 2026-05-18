export function formatScheduleTimeLabel(time24: string): string {
  const [hourPart, minutePart] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hourPart ?? 0, minutePart ?? 0, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatScheduleDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}
