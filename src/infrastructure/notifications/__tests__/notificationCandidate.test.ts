import {
  GLOBAL_PENDING_NOTIFICATION_BUDGET,
  isUnmanagedTriggerId,
  priorityForReminderLead,
  priorityForSmartHealthSlot,
  priorityForDailySchedule,
} from '../notificationCandidate';

describe('notificationCandidate', () => {
  it('exposes global budget 64', () => {
    expect(GLOBAL_PENDING_NOTIFICATION_BUDGET).toBe(64);
  });

  it('maps reminder leads to P1/P3', () => {
    expect(priorityForReminderLead('due')).toBe(1);
    expect(priorityForReminderLead('1h')).toBe(1);
    expect(priorityForReminderLead('24h')).toBe(3);
  });

  it('maps smart health slots to P0/P3', () => {
    expect(priorityForSmartHealthSlot('overdue')).toBe(0);
    expect(priorityForSmartHealthSlot('due')).toBe(0);
    expect(priorityForSmartHealthSlot('d2')).toBe(3);
  });

  it('maps daily schedule to P2', () => {
    expect(priorityForDailySchedule()).toBe(2);
  });

  it('treats self-test id as unmanaged', () => {
    expect(isUnmanagedTriggerId('pawfect-notification-test')).toBe(true);
    expect(isUnmanagedTriggerId('reminder-x-due')).toBe(false);
  });
});
