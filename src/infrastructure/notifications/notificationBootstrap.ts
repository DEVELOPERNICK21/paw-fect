import notifee, { EventType, type ForegroundEvent } from '@notifee/react-native';
import { Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '../../app/navigation/navigationRef';

import {
  CARE_NOTIFICATION_ACTION_DONE,
  CARE_NOTIFICATION_ACTION_SNOOZE_15,
  CARE_NOTIFICATION_ACTION_SNOOZE_60,
} from './careNotificationActions';
import { emitNotificationFeedEvent } from './notificationFeedEvents';
import { ensureNotificationChannels, requestNotificationPermission } from './notificationChannels';
import { handleCareNotificationAction } from './handleCareNotificationAction';

type RootNav = typeof navigationRef;

async function ensureCareNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  try {
    await notifee.setNotificationCategories([
      {
        id: 'care_schedule',
        actions: [
          {
            id: CARE_NOTIFICATION_ACTION_DONE,
            title: 'Done',
            foreground: true,
          },
          {
            id: CARE_NOTIFICATION_ACTION_SNOOZE_15,
            title: 'Snooze 15m',
            foreground: true,
          },
          {
            id: CARE_NOTIFICATION_ACTION_SNOOZE_60,
            title: 'Snooze 1h',
            foreground: true,
          },
        ],
      },
    ]);
  } catch {
    // Best effort — categories optional until iOS entitlements are set.
  }
}

export async function bootstrapLocalNotifications(): Promise<void> {
  await ensureNotificationChannels();
  await requestNotificationPermission();
  await ensureCareNotificationCategories();
}

export async function processNotificationInteraction(
  type: number,
  detail: ForegroundEvent['detail'],
  nav: RootNav,
  canNavigate: () => boolean,
): Promise<void> {
  const data = detail.notification?.data as Record<string, string> | undefined;
  const actionId =
    (detail as { pressAction?: { id?: string } }).pressAction?.id ??
    undefined;

  if (type === EventType.ACTION_PRESS) {
    const handled = await handleCareNotificationAction(actionId, data);
    if (handled) {
      return;
    }
  }

  if (type === EventType.DELIVERED) {
    recordDeliveredToFeed(detail);
    return;
  }

  if (type === EventType.PRESS) {
    navigateFromNotificationData(nav, data, canNavigate);
  }
}

function navigateFromNotificationData(
  nav: RootNav,
  data: Record<string, string> | undefined,
  canNavigate: () => boolean,
): void {
  if (!canNavigate() || !nav.isReady() || data == null) {
    return;
  }
  if (data.reminderId) {
    nav.dispatch(
      CommonActions.navigate({
        name: 'NotificationsTab',
        params: {
          screen: 'ReminderDetail',
          params: { reminderId: data.reminderId },
        },
      }),
    );
    return;
  }
  if (data.recordId) {
    nav.dispatch(
      CommonActions.navigate({
        name: 'HealthTab',
        params: { screen: 'HealthRecords' },
      }),
    );
    return;
  }
  if (data.kind === 'dailySchedule' && data.petId) {
    nav.dispatch(
      CommonActions.navigate({
        name: 'NotificationsTab',
        params: {
          screen: 'WellnessHub',
          params: {
            petId: data.petId,
            blockId: data.blockId,
          },
        },
      }),
    );
    return;
  }
  if (data.kind === 'dailyRoutine') {
    nav.dispatch(
      CommonActions.navigate({
        name: 'PetsTab',
        params: { screen: 'PetProfile' },
      }),
    );
    return;
  }
  if (data.kind === 'loginWelcome') {
    nav.dispatch(
      CommonActions.navigate({
        name: 'HomeTab',
        params: { screen: 'Home' },
      }),
    );
  }
}

function recordDeliveredToFeed(detail: ForegroundEvent['detail']): void {
  const n = detail.notification as
    | {
        id?: string;
        title?: string;
        body?: string;
        data?: Record<string, string>;
      }
    | undefined;
  if (n?.id == null || n.id.length === 0) {
    return;
  }
  const rawData = n.data;
  const data =
    rawData != null && typeof rawData === 'object'
      ? (rawData as Record<string, string>)
      : {};
  emitNotificationFeedEvent({
    type: 'delivered',
    payload: {
      id: n.id,
      title: n.title ?? '',
      body: n.body ?? '',
      data,
      deliveredAtIso: new Date().toISOString(),
    },
  });
}

export function subscribeNotificationNavigation(
  nav: RootNav,
  canNavigate: () => boolean,
): () => void {
  return notifee.onForegroundEvent((event: ForegroundEvent) => {
    void processNotificationInteraction(
      event.type,
      event.detail,
      nav,
      canNavigate,
    );
  });
}

export async function flushInitialNotificationNavigation(
  nav: RootNav,
  canNavigate: () => boolean,
): Promise<void> {
  const initial = await notifee.getInitialNotification();
  navigateFromNotificationData(
    nav,
    initial?.notification?.data as Record<string, string> | undefined,
    canNavigate,
  );
}
