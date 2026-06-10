import { NativeModules, Platform } from 'react-native';

import { resyncLocalNotificationsFromStorage } from './resyncLocalNotificationsFromStorage';

interface NotificationBootModuleShape {
  consumeBootResyncFlag: () => Promise<boolean>;
}

const nativeModule = NativeModules.NotificationBootModule as
  | NotificationBootModuleShape
  | undefined;

export async function consumeAndroidBootResyncFlag(): Promise<boolean> {
  if (Platform.OS !== 'android' || nativeModule?.consumeBootResyncFlag == null) {
    return false;
  }
  try {
    return await nativeModule.consumeBootResyncFlag();
  } catch {
    return false;
  }
}

export async function runBootNotificationResyncIfNeeded(): Promise<void> {
  const needsResync = await consumeAndroidBootResyncFlag();
  if (!needsResync) {
    return;
  }
  await resyncLocalNotificationsFromStorage({
    promptExactAlarmIfDisabled: false,
  });
}
