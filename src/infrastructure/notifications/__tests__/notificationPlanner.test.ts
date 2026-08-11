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

  it('prefers sooner fireAt within same priority', () => {
    const sooner = new Date('2030-06-01T12:00:00');
    const later = new Date('2030-06-01T13:00:00');
    const selected = selectCandidates(
      [
        cand({ id: 'later', priority: 2, fireAt: later }),
        cand({ id: 'sooner', priority: 2, fireAt: sooner }),
      ],
      'p1',
      1,
    );
    expect(selected.map(c => c.id)).toEqual(['sooner']);
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
    const winner = cand({ id: 'reminder-new-due', priority: 1, fireAt: t });
    const result = await planAndApply({
      candidates: [winner],
      activePetId: 'p1',
      service,
      budget: 64,
    });
    expect(result.selected).toEqual([winner]);
    expect(result.scheduledIds).toEqual(['reminder-new-due']);
    expect(result.cancelledIds).toEqual(['reminder-old-due', 'routine-feed-p1']);
    expect(result.droppedByKind).toEqual({});
    expect(cancelled).toEqual(['reminder-old-due', 'routine-feed-p1']);
    expect(cancelled).not.toContain('pawfect-notification-test');
    expect(scheduled).toEqual(['reminder-new-due']);
  });

  it('counts dropped candidates by kind when over budget', async () => {
    const service: NotificationService = {
      scheduleNotification: async () => {},
      displayImmediateNotification: async () => {},
      cancelNotification: async () => {},
      cancelAllNotifications: async () => {},
      getTriggerNotificationIds: async () => [],
    };
    const sooner = new Date('2030-06-01T12:00:00');
    const later = new Date('2030-06-01T13:00:00');
    const winner = cand({
      id: 'reminder-sooner',
      kind: 'reminder',
      priority: 1,
      fireAt: sooner,
    });
    const loser = cand({
      id: 'health-later',
      kind: 'smartHealth',
      priority: 1,
      fireAt: later,
    });
    const result = await planAndApply({
      candidates: [winner, loser],
      activePetId: 'p1',
      service,
      budget: 1,
    });
    expect(result.selected).toEqual([winner]);
    expect(result.scheduledIds).toEqual(['reminder-sooner']);
    expect(result.cancelledIds).toEqual([]);
    expect(result.droppedByKind).toEqual({ smartHealth: 1 });
  });
});
