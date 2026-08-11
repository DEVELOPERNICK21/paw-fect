jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getTriggerNotifications: jest.fn(async () => []),
  },
}));

import type { DailyCareBlock } from '../../domain/models/DailyCareBlock';
import type { DailySchedule } from '../../domain/models/DailySchedule';
import type { NotificationService } from '../../../../infrastructure/notifications/notificationService';
import {
  buildScheduleNotificationCandidates,
  cancelScheduleBlockNotification,
  scheduleNotificationId,
  syncScheduleNotifications,
} from '../scheduleNotificationSync';

function createBlock(overrides: Partial<DailyCareBlock>): DailyCareBlock {
  return {
    id: 'block-1',
    petId: 'pet-1',
    category: 'feeding',
    title: 'Breakfast',
    description: 'Meal',
    scheduledTime: '08:00',
    durationMinutes: 15,
    frequency: 'daily',
    reminderEnabled: true,
    reminderMinutesBefore: 0,
    notificationTitle: "Buddy's Meal Time 🍽️",
    notificationBody: 'Breakfast',
    isCompleted: false,
    completedAt: null,
    isFreeFeature: true,
    order: 1,
    ...overrides,
  };
}

describe('scheduleNotificationSync', () => {
  it('[NOT-SCH-01] cancels a block notification when it is marked done', async () => {
    const service: NotificationService = {
      scheduleNotification: jest.fn(async () => undefined),
      displayImmediateNotification: jest.fn(async () => undefined),
      cancelNotification: jest.fn(async () => undefined),
      cancelAllNotifications: jest.fn(async () => undefined),
    };

    await cancelScheduleBlockNotification('block-1', 'pet-1', service);
    expect(service.cancelNotification).toHaveBeenCalledWith(
      scheduleNotificationId('pet-1', 'block-1'),
    );
  });

  it('[NOT-SCH-02] skips completed blocks during reconciliation', async () => {
    const service: NotificationService = {
      scheduleNotification: jest.fn(async () => undefined),
      displayImmediateNotification: jest.fn(async () => undefined),
      cancelNotification: jest.fn(async () => undefined),
      cancelAllNotifications: jest.fn(async () => undefined),
    };
    const schedule: DailySchedule = {
      petId: 'pet-1',
      date: '2099-01-01',
      blocks: [],
      completionPercent: 100,
      streakDays: 1,
      wellnessScore: 100,
    };
    const blocks = [
      createBlock({ id: 'done', isCompleted: true }),
      createBlock({
        id: 'pending',
        category: 'walk',
        scheduledTime: '09:00',
        notificationTitle: "Buddy's Walk Time 🐾",
      }),
    ];

    const scheduled = await syncScheduleNotifications(schedule, blocks, service);
    expect(scheduled).toBe(1);
    expect(service.scheduleNotification).toHaveBeenCalledTimes(1);
  });

  it('[NOT-SCH-03] prioritizes feeding notifications before play when over quota', async () => {
    const service: NotificationService = {
      scheduleNotification: jest.fn(async () => undefined),
      displayImmediateNotification: jest.fn(async () => undefined),
      cancelNotification: jest.fn(async () => undefined),
      cancelAllNotifications: jest.fn(async () => undefined),
    };
    const schedule: DailySchedule = {
      petId: 'pet-1',
      date: '2099-01-01',
      blocks: [],
      completionPercent: 0,
      streakDays: 0,
      wellnessScore: 0,
    };
    const blocks = Array.from({ length: 70 }, (_, index) =>
      createBlock({
        id: `block-${index}`,
        category: index % 2 === 0 ? 'play' : 'feeding',
        scheduledTime: `${String(6 + (index % 12)).padStart(2, '0')}:00`,
        notificationTitle:
          index % 2 === 0 ? `Play ${index}` : `Buddy's Meal Time ${index}`,
        notificationBody: `Body ${index}`,
      }),
    );

    const scheduled = await syncScheduleNotifications(schedule, blocks, service);
    expect(scheduled).toBeLessThanOrEqual(64);
    const firstCall = (service.scheduleNotification as jest.Mock).mock.calls[0]?.[0];
    expect(firstCall?.title).toContain('Meal');
  });
});

function createSchedule(overrides: Partial<DailySchedule> = {}): DailySchedule {
  return {
    petId: 'pet-1',
    date: '2030-06-01',
    blocks: [],
    completionPercent: 0,
    streakDays: 0,
    wellnessScore: 0,
    ...overrides,
  };
}

describe('buildScheduleNotificationCandidates', () => {
  it('emits one P2 candidate per enabled incomplete block in the future', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const schedule = createSchedule();
    const blocks = [
      createBlock({
        id: 'block-1',
        category: 'walk',
        scheduledTime: '18:00',
        frequency: 'once',
        notificationTitle: 'Walk',
        notificationBody: 'Time',
      }),
    ];

    const candidates = buildScheduleNotificationCandidates(
      schedule,
      blocks,
      undefined,
      nowMs,
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.id).toBe(scheduleNotificationId('pet-1', 'block-1'));
    expect(candidates[0]?.priority).toBe(2);
    expect(candidates[0]?.kind).toBe('dailySchedule');
    expect(candidates[0]?.payload.id).toBe(candidates[0]?.id);
  });

  it('does not locally cap at 64 (returns all future enabled blocks)', () => {
    const nowMs = Date.parse('2099-01-01T00:00:00');
    const schedule = createSchedule({ date: '2099-01-01' });
    const blocks = Array.from({ length: 70 }, (_, index) =>
      createBlock({
        id: `block-${index}`,
        category: index % 2 === 0 ? 'play' : 'feeding',
        scheduledTime: `${String(6 + (index % 12)).padStart(2, '0')}:00`,
        notificationTitle:
          index % 2 === 0 ? `Play ${index}` : `Buddy's Meal Time ${index}`,
        notificationBody: `Body ${index}`,
      }),
    );

    const candidates = buildScheduleNotificationCandidates(
      schedule,
      blocks,
      undefined,
      nowMs,
    );

    expect(candidates).toHaveLength(70);
  });
});
