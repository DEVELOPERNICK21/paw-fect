import { Platform } from 'react-native';

import { NotifeeNotificationService } from './notifeeNotificationService';

export interface NotificationActionButton {
  title: string;
  pressActionId: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  scheduledDate: Date;
  /** String values only (OS notification payload contract). */
  data?: Record<string, string>;
  /** When set, OS repeats from the first fire time (Notifee repeat). */
  repeat?: 'daily' | 'weekly';
  /** Android notification action buttons (e.g. Done / Snooze). */
  actions?: NotificationActionButton[];
}

export interface ImmediateNotificationPayload {
  /** Stable id replaces any previous notification with the same id. */
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationService {
  scheduleNotification(payload: NotificationPayload): Promise<void>;
  displayImmediateNotification(payload: ImmediateNotificationPayload): Promise<void>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}

class NoopNotificationService implements NotificationService {
  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] scheduleNotification (noop)', {
        platform: Platform.OS,
        payload,
      });
    }
  }

  async displayImmediateNotification(payload: ImmediateNotificationPayload): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] displayImmediateNotification (noop)', {
        platform: Platform.OS,
        payload,
      });
    }
  }

  async cancelNotification(id: string): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] cancelNotification (noop)', {
        platform: Platform.OS,
        id,
      });
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] cancelAllNotifications (noop)', {
        platform: Platform.OS,
      });
    }
  }
}

/** Real scheduling via Notifee; falls back to noop in test environments without native module. */
export const notificationService: NotificationService =
  Platform.OS === 'web' ? new NoopNotificationService() : new NotifeeNotificationService();
