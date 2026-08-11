import notifee, { EventType, type ForegroundEvent } from '@notifee/react-native';
import { Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '../../app/navigation/navigationRef';
import { trackEvent } from '../analytics/analytics';

import {
  CARE_NOTIFICATION_ACTION_DONE,
  CARE_NOTIFICATION_ACTION_SNOOZE_15,
  CARE_NOTIFICATION_ACTION_SNOOZE_60,
} from './careNotificationActions';
import { emitNotificationFeedEvent } from './notificationFeedEvents';
import { ensureNotificationChannels, requestNotificationPermission } from './notificationChannels';
import { handleCareNotificationAction } from './handleCareNotificationAction';
import {
  getNotificationNavigationTarget,
  type NotificationNavigationTarget,
} from './getNotificationNavigationTarget';

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

export function trackNotificationTapped(
  notificationId: string | undefined,
  data: Record<string, string> | undefined,
): void {
  if (data == null) {
    return;
  }
  void trackEvent('notification_tapped', {
    kind: data.kind ?? 'unknown',
    notification_id: notificationId ?? '',
    pet_id: data.petId ?? '',
  });
}

function dispatchNotificationNavigationTarget(
  nav: RootNav,
  target: NotificationNavigationTarget,
): void {
  switch (target.target) {
    case 'reminderDetail':
      nav.dispatch(
        CommonActions.navigate({
          name: 'NotificationsTab',
          params: {
            screen: 'ReminderDetail',
            params: { reminderId: target.reminderId },
          },
        }),
      );
      return;
    case 'healthRecords':
      nav.dispatch(
        CommonActions.navigate({
          name: 'HealthTab',
          params: {
            screen: 'HealthRecords',
            params: {
              focusRecordId: target.focusRecordId,
              petId: target.petId,
            },
          },
        }),
      );
      return;
    case 'wellnessHub':
      nav.dispatch(
        CommonActions.navigate({
          name: 'NotificationsTab',
          params: {
            screen: 'WellnessHub',
            params: {
              petId: target.petId,
              blockId: target.blockId,
            },
          },
        }),
      );
      return;
    case 'petProfile':
      nav.dispatch(
        CommonActions.navigate({
          name: 'PetsTab',
          params: { screen: 'PetProfile' },
        }),
      );
      return;
    case 'home':
      nav.dispatch(
        CommonActions.navigate({
          name: 'HomeTab',
          params: { screen: 'Home' },
        }),
      );
  }
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
    trackNotificationTapped(detail.notification?.id, data);
    navigateFromNotificationData(nav, data, canNavigate);
  }
}

function navigateFromNotificationData(
  nav: RootNav,
  data: Record<string, string> | undefined,
  canNavigate: () => boolean,
): void {
  if (!canNavigate() || !nav.isReady()) {
    return;
  }
  const target = getNotificationNavigationTarget(data);
  if (target == null) {
    return;
  }
  dispatchNotificationNavigationTarget(nav, target);
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
  const notification = initial?.notification as
    | { id?: string; data?: Record<string, string> }
    | undefined;
  const data = notification?.data as Record<string, string> | undefined;
  trackNotificationTapped(notification?.id, data);
  navigateFromNotificationData(nav, data, canNavigate);
}
