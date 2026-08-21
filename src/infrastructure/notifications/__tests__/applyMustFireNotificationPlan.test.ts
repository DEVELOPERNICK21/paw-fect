jest.mock('../notificationService', () => ({
  notificationService: {},
}));

jest.mock('../../analytics/analytics', () => ({
  trackEvent: jest.fn(async () => {}),
}));

import type { DailyCareBlock } from '../../../modules/schedule/domain/models/DailyCareBlock';
import type { DailySchedule } from '../../../modules/schedule/domain/models/DailySchedule';
import type { SmartHealthRecord } from '../../../modules/records/domain/models/SmartHealthRecord';
import { buildScheduleNotificationCandidates } from '../../../modules/schedule/data/notifications/scheduleNotificationSync';
import { trackEvent } from '../../analytics/analytics';
import type { NotificationService } from '../notificationService';
import { applyMustFireNotificationPlan } from '../applyMustFireNotificationPlan';
import type { ReminderScheduleInput } from '../reminderSchedule';

const NOW_MS = Date.parse('2030-01-01T08:00:00');

function baseHealthRecord(overrides: Partial<SmartHealthRecord> = {}): SmartHealthRecord {
  return {
    id: 'rec-1',
    petId: 'pet-1',
    name: 'Rabies',
    type: 'vaccination',
    dueDate: '2030-06-15',
    status: 'upcoming',
    completedDate: null,
    recurrenceType: 'yearly',
    userId: 'user-1',
    createdAt: '2030-01-01T00:00:00',
    updatedAt: '2030-01-01T00:00:00',
    ...overrides,
  };
}

function createBlock(overrides: Partial<DailyCareBlock> = {}): DailyCareBlock {
  return {
    id: 'block-1',
    petId: 'pet-1',
    category: 'feeding',
    title: 'Breakfast',
    description: 'Meal',
    scheduledTime: '09:00',
    durationMinutes: 15,
    frequency: 'daily',
    reminderEnabled: true,
    reminderMinutesBefore: 0,
    notificationTitle: "Buddy's Meal Time",
    notificationBody: 'Breakfast',
    isCompleted: false,
    completedAt: null,
    isFreeFeature: true,
    order: 1,
    ...overrides,
  };
}

describe('applyMustFireNotificationPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('merges reminder, health, and schedule candidates and cancels routine pending', async () => {
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
      getTriggerNotificationIds: async () => ['routine-feed-pet-1', 'reminder-old-due'],
    };

    const reminder: ReminderScheduleInput = {
      id: 'rem-1',
      petId: 'pet-1',
      title: 'Vet visit',
      date: '2030-06-01',
      time: '10:00',
      petSpecies: 'dog',
    };

    const schedule: DailySchedule = {
      petId: 'pet-1',
      date: '2030-06-01',
      blocks: [createBlock()],
      completionPercent: 0,
      streakDays: 0,
      wellnessScore: 0,
    };

    const result = await applyMustFireNotificationPlan({
      reminders: [reminder],
      healthRecords: [baseHealthRecord()],
      scheduleCandidates: buildScheduleNotificationCandidates(
        schedule,
        schedule.blocks,
        'dog',
        NOW_MS,
      ),
      activePetId: 'pet-1',
      service,
      nowMs: NOW_MS,
    });

    expect(result.selected.length).toBeLessThanOrEqual(64);
    expect(result.selected.length).toBeGreaterThan(0);
    expect(cancelled).toContain('routine-feed-pet-1');
    expect(cancelled).toContain('reminder-old-due');
    expect(scheduled.length).toBe(result.selected.length);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tracks notification_budget_dropped when candidates exceed budget', async () => {
    const service: NotificationService = {
      scheduleNotification: async () => {},
      displayImmediateNotification: async () => {},
      cancelNotification: async () => {},
      cancelAllNotifications: async () => {},
      getTriggerNotificationIds: async () => [],
    };

    const reminders: ReminderScheduleInput[] = [];
    for (let i = 0; i < 40; i += 1) {
      reminders.push({
        id: `rem-${i}`,
        petId: 'pet-1',
        title: `Reminder ${i}`,
        date: '2030-12-01',
        time: `${String(10 + (i % 10)).padStart(2, '0')}:00`,
        petSpecies: 'dog',
      });
    }

    const healthRecords: SmartHealthRecord[] = [];
    for (let i = 0; i < 40; i += 1) {
      healthRecords.push(
        baseHealthRecord({
          id: `rec-${i}`,
          dueDate: `2030-${String((i % 12) + 1).padStart(2, '0')}-15`,
        }),
      );
    }

    const result = await applyMustFireNotificationPlan({
      reminders,
      healthRecords,
      scheduleCandidates: [],
      activePetId: 'pet-1',
      service,
      nowMs: NOW_MS,
      budget: 10,
    });

    expect(result.selected.length).toBe(10);
    expect(trackEvent).toHaveBeenCalledWith(
      'notification_budget_dropped',
      expect.objectContaining({}),
    );
  });
});
