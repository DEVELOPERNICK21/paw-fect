import type { SmartHealthRecord } from '../../../modules/records/domain/models/SmartHealthRecord';
import {
  buildSmartHealthCandidatesForRecords,
  buildSmartHealthNotificationCandidates,
  localDateOnCalendarDay,
  scheduleSmartHealthDueNotifications,
} from '../smartHealthNotificationSchedule';

function baseRecord(overrides: Partial<SmartHealthRecord> = {}): SmartHealthRecord {
  return {
    id: 'rec-1',
    petId: 'pet-1',
    name: 'Rabies',
    type: 'vaccination',
    dueDate: '2030-06-15',
    status: 'upcoming',
    completedDate: null,
    family: null,
    recurrenceType: 'yearly',
    userId: 'user-1',
    createdAt: '2030-01-01T00:00:00',
    updatedAt: '2030-01-01T00:00:00',
    ...overrides,
  };
}

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
      getTriggerNotificationIds: jest.fn(),
    };

    await scheduleSmartHealthDueNotifications(
      baseRecord({
        name: 'Deworming',
        type: 'deworming',
        dueDate: '2026-05-15',
        recurrenceType: 'quarterly',
      }),
      service,
    );

    expect(scheduled.map(item => item.id)).toEqual([
      'health-rec-1-overdue',
    ]);
    expect(scheduled[0]?.scheduledDate.getDate()).toBe(16);

    jest.useRealTimers();
  });
});

describe('buildSmartHealthNotificationCandidates', () => {
  it('assigns P0 to due/overdue and P3 to d2', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const candidates = buildSmartHealthNotificationCandidates(
      baseRecord(),
      undefined,
      nowMs,
    );
    const byId = Object.fromEntries(candidates.map(c => [c.id, c.priority]));
    expect(byId['health-rec-1-d2']).toBe(3);
    expect(byId['health-rec-1-due']).toBe(0);
    expect(byId['health-rec-1-overdue']).toBe(0);
  });

  it('returns [] for completed records', () => {
    expect(
      buildSmartHealthNotificationCandidates(
        baseRecord({ status: 'completed' }),
        undefined,
        Date.parse('2030-06-01T00:00:00'),
      ),
    ).toEqual([]);
  });

  it('returns [] for skipped records', () => {
    expect(
      buildSmartHealthNotificationCandidates(
        baseRecord({ status: 'skipped' }),
        undefined,
        Date.parse('2030-06-01T00:00:00'),
      ),
    ).toEqual([]);
  });
});

describe('buildSmartHealthCandidatesForRecords', () => {
  it('only builds candidates for records selected for notifications', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const records = [
      baseRecord({ id: 'rec-1', dueDate: '2030-06-15' }),
      baseRecord({
        id: 'rec-2',
        dueDate: '2030-06-20',
        status: 'completed',
      }),
    ];
    const candidates = buildSmartHealthCandidatesForRecords(records, undefined, nowMs);
    const recordIds = new Set(
      candidates.map(c => c.payload.data?.recordId).filter(Boolean),
    );
    expect(recordIds).toEqual(new Set(['rec-1']));
  });
});
