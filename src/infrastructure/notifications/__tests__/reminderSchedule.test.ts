import {
  parseReminderLocalDateTime,
  reminderNotificationIds,
} from '../reminderSchedule';
import { isFutureReminderDateTime } from '../../../shared/utils/reminderDateTime';

describe('parseReminderLocalDateTime', () => {
  it('parses 24-hour reminder times', () => {
    const date = parseReminderLocalDateTime('2026-05-15', '09:00');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(9);
    expect(date?.getMinutes()).toBe(0);
  });
});

describe('reminderNotificationIds', () => {
  it('includes due-time trigger id', () => {
    expect(reminderNotificationIds('rem-1')).toEqual([
      'reminder-rem-1-24h',
      'reminder-rem-1-1h',
      'reminder-rem-1-due',
    ]);
  });
});

describe('isFutureReminderDateTime', () => {
  it('rejects past reminder times', () => {
    const now = new Date('2030-01-01T12:00:00');
    expect(isFutureReminderDateTime('2030-01-01', '10:00', now)).toBe(false);
  });
});
