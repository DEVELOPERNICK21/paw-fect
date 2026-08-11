import { notificationService } from '../notificationService';
import { scheduleNotificationSelfTest } from '../notificationDiagnostics';

jest.mock('../../logging/startupLog', () => ({
  startupLog: jest.fn(),
  startupError: jest.fn(),
}));

jest.mock('../notificationChannels', () => ({
  ensureNotificationChannels: jest.fn(async () => undefined),
  requestNotificationPermission: jest.fn(async () => true),
}));

jest.mock('../androidAlarmPermissions', () => ({
  canUseAndroidExactAlarms: jest.fn(async () => true),
  openAndroidExactAlarmSettings: jest.fn(),
}));

jest.mock('../notificationService', () => ({
  notificationService: {
    scheduleNotification: jest.fn(async () => undefined),
  },
}));

describe('scheduleNotificationSelfTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('schedules with custom sound profile when pet species is provided', async () => {
    const result = await scheduleNotificationSelfTest(60_000, {
      petSpecies: 'dog',
      tone: 'meal',
      tier: 'soft',
    });

    expect(result.soundProfile).toBe('dog_meal_soft');
    expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          soundProfile: 'dog_meal_soft',
          petSpecies: 'dog',
        }),
      }),
    );
  });

  it('falls back to generic test payload without a pet', async () => {
    const result = await scheduleNotificationSelfTest(60_000);

    expect(result.soundProfile).toBeUndefined();
    expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { kind: 'notificationTest' },
      }),
    );
  });
});
