import {
  ALL_SOUND_PROFILES,
  buildSoundProfile,
  channelIdForSoundProfile,
} from '../notificationSoundCatalog';
import {
  PET_SPECIES_DATA_KEY,
  resolveAndroidNotificationSound,
  resolveIosNotificationSound,
  withNotificationSound,
} from '../petNotificationSounds';
import { channelIdForNotificationData } from '../notificationChannelRouting';

describe('petNotificationSounds', () => {
  it('resolves platform sound names from sound profile data', () => {
    const data = withNotificationSound(
      { kind: 'dailyRoutine', petId: 'p1', routine: 'feed' },
      'dog',
      'meal',
      'soft',
    );
    expect(resolveAndroidNotificationSound(data)).toBe('dog_meal_soft');
    expect(resolveIosNotificationSound(data)).toBe('dog_meal_soft.wav');
  });

  it('embeds species and profile in notification data', () => {
    expect(
      withNotificationSound({ kind: 'dailyRoutine', petId: 'p1' }, 'cat', 'active', 'urgent'),
    ).toEqual({
      kind: 'dailyRoutine',
      petId: 'p1',
      [PET_SPECIES_DATA_KEY]: 'cat',
      soundProfile: 'cat_active_urgent',
    });
  });

  it('lists every bundled profile', () => {
    expect(ALL_SOUND_PROFILES).toHaveLength(24);
    expect(ALL_SOUND_PROFILES).toContain(buildSoundProfile('dog', 'health', 'urgent'));
  });
});

describe('channelIdForNotificationData', () => {
  it('routes profiled alerts to dedicated Android channels', () => {
    const data = withNotificationSound(
      { kind: 'smartHealth' },
      'dog',
      'health',
      'urgent',
    );
    expect(channelIdForNotificationData(data)).toBe(
      channelIdForSoundProfile('dog_health_urgent'),
    );
  });
});
