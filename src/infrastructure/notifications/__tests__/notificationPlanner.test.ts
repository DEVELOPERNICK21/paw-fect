import { planAndApply, selectCandidates } from '../notificationPlanner';
import type { NotificationCandidate } from '../notificationCandidate';
import type { NotificationService } from '../notificationService';

function cand(
  partial: Partial<NotificationCandidate> & Pick<NotificationCandidate, 'id' | 'priority' | 'fireAt'>,
): NotificationCandidate {
  return {
    kind: 'reminder',
    petId: 'p1',
    payload: {
      id: partial.id,
      title: 't',
      body: 'b',
      scheduledDate: partial.fireAt,
      data: { kind: 'reminder' },
    },
    ...partial,
  };
}

describe('selectCandidates', () => {
  it('keeps P0 over P3 when over budget', () => {
    const many: NotificationCandidate[] = [];
    for (let i = 0; i < 64; i += 1) {
      many.push(
        cand({
          id: `health-r${i}-due`,
          kind: 'smartHealth',
          priority: 0,
          fireAt: new Date(Date.UTC(2030, 0, 1, 9, 0, 0) + i * 1000),
        }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      many.push(
        cand({
          id: `reminder-r${i}-24h`,
          priority: 3,
          fireAt: new Date(Date.UTC(2030, 0, 2, 9, 0, 0) + i * 1000),
        }),
      );
    }
    const selected = selectCandidates(many, 'p1', 64);
    expect(selected).toHaveLength(64);
    expect(selected.every(c => c.priority === 0)).toBe(true);
  });

  it('prefers active pet when priority and time tie', () => {
    const t = new Date('2030-06-01T12:00:00');
    const selected = selectCandidates(
      [
        cand({ id: 'a', petId: 'other', priority: 2, fireAt: t }),
        cand({ id: 'b', petId: 'active', priority: 2, fireAt: t }),
      ],
      'active',
      1,
    );
    expect(selected.map(c => c.id)).toEqual(['b']);
  });
});

describe('planAndApply', () => {
  it('cancels managed pending ids not selected and schedules winners', async () => {
    const scheduled: string[] = [];
    const cancelled: string[] = [];
    const service: NotificationService = {
      scheduleNotification: async payload => {
        scheduled.push(payload.id);
      },
      displayImmediateNotification: async () => {},
      cancelNotification: async id => {
        cancelled.push(id);
      },
      cancelAllNotifications: async () => {},
      getTriggerNotificationIds: async () => [
        'reminder-old-due',
        'routine-feed-p1',
        'pawfect-notification-test',
      ],
    };
    const t = new Date('2030-06-01T12:00:00');
    const result = await planAndApply({
      candidates: [cand({ id: 'reminder-new-due', priority: 1, fireAt: t })],
      activePetId: 'p1',
      service,
      budget: 64,
    });
    expect(result.scheduledIds).toEqual(['reminder-new-due']);
    expect(cancelled).toEqual(
      expect.arrayContaining(['reminder-old-due', 'routine-feed-p1']),
    );
    expect(cancelled).not.toContain('pawfect-notification-test');
    expect(scheduled).toEqual(['reminder-new-due']);
  });
});
