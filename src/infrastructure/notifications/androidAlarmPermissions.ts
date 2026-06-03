import notifee, { AndroidNotificationSetting } from '@notifee/react-native';
import { Platform } from 'react-native';

export async function canUseAndroidExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const settings = await notifee.getNotificationSettings();
    return settings.android.alarm !== AndroidNotificationSetting.DISABLED;
  } catch {
    // Older devices / Notifee versions may not expose the setting. Let scheduling proceed.
    return true;
  }
}

export async function openAndroidExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.openAlarmPermissionSettings();
}
