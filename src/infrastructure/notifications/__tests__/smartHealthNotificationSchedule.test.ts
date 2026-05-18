import {
  localDateOnCalendarDay,
  scheduleSmartHealthDueNotifications,
} from '../smartHealthNotificationSchedule';

describe('localDateOnCalendarDay', () => {
  it('builds a local date from YYYY-MM-DD', () => {
    const date = localDateOnCalendarDay('2026-05-15', 9, 30);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });
});

describe('scheduleSmartHealthDueNotifications', () => {
  it('skips past notification slots', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T10:00:00'));

    const scheduled: Array<{ id: string; scheduledDate: Date }> = [];
    const service = {
      scheduleNotification: jest.fn(async payload => {
        scheduled.push({ id: payload.id, scheduledDate: payload.scheduledDate });
      }),
      cancelNotification: jest.fn(),
      displayImmediateNotification: jest.fn(),
      cancelAllNotifications: jest.fn(),
    };

    await scheduleSmartHealthDueNotifications(
      {
        id: 'rec-1',
        petId: 'pet-1',
        name: 'Deworming',
        type: 'deworming',
        status: 'upcoming',
        dueDate: '2026-05-15',
        completedDate: null,
        family: null,
        recurrenceType: 'quarterly',
        userId: 'user-1',
      },
      service,
    );

    expect(scheduled.map(item => item.id)).toEqual([
      'health-rec-1-overdue',
    ]);
    expect(scheduled[0]?.scheduledDate.getDate()).toBe(16);

    jest.useRealTimers();
  });
});
