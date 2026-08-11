import {
  buildReminderNotificationCandidates,
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

describe('buildReminderNotificationCandidates', () => {
  const reminder = {
    id: 'rem-1',
    petId: 'pet-1',
    title: 'Vaccination',
    date: '2030-06-15',
    time: '10:00',
  };

  it('returns 24h, 1h, and due candidates with priorities', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const candidates = buildReminderNotificationCandidates(reminder, nowMs);
    expect(candidates.map(c => c.id)).toEqual([
      'reminder-rem-1-24h',
      'reminder-rem-1-1h',
      'reminder-rem-1-due',
    ]);
    expect(candidates.map(c => c.priority)).toEqual([3, 1, 1]);
    expect(candidates.every(c => c.payload.id === c.id)).toBe(true);
  });

  it('returns no candidates when due time is in the past', () => {
    const nowMs = Date.parse('2030-06-16T00:00:00');
    expect(buildReminderNotificationCandidates(reminder, nowMs)).toEqual([]);
  });
});
