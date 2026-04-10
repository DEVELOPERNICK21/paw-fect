import notifee, { EventType, type ForegroundEvent } from '@notifee/react-native';
import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '../../app/navigation/navigationRef';

import { emitNotificationFeedEvent } from './notificationFeedEvents';
import { ensureNotificationChannels, requestNotificationPermission } from './notificationChannels';

type RootNav = typeof navigationRef;

export async function bootstrapLocalNotifications(): Promise<void> {
  await ensureNotificationChannels();
  await requestNotificationPermission();
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
    const { type, detail } = event;
    if (type === EventType.DELIVERED) {
      recordDeliveredToFeed(detail);
      return;
    }
    if (type === EventType.PRESS) {
      navigateFromNotificationData(
        nav,
        detail.notification?.data as Record<string, string> | undefined,
        canNavigate,
      );
    }
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
