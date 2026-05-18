import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

export const PAWFECT_CHANNEL_CARE = 'pawfect-care';
export const PAWFECT_CHANNEL_REMINDERS = 'pawfect-reminders';
export const PAWFECT_CHANNEL_ROUTINES = 'pawfect-routines';
export const PAWFECT_CHANNEL_GENERAL = 'pawfect-general';

/**
 * Android channels + iOS permission. Safe to call on every cold start.
 */
export async function ensureNotificationChannels(): Promise<void> {
  await notifee.createChannel({
    id: PAWFECT_CHANNEL_CARE,
    name: 'Vaccination & deworming',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
  await notifee.createChannel({
    id: PAWFECT_CHANNEL_REMINDERS,
    name: 'Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
  await notifee.createChannel({
    id: PAWFECT_CHANNEL_ROUTINES,
    name: 'Daily pet routines',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: true,
  });
  await notifee.createChannel({
    id: PAWFECT_CHANNEL_GENERAL,
    name: 'Pawfect',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: false,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}
