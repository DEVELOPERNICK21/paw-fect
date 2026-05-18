export function todayGreeting(date = new Date()): string {
  const hours = date.getHours();
  if (hours < 12) {
    return 'Good morning';
  }
  if (hours < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}
