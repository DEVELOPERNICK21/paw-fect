import { Platform } from 'react-native';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  scheduledDate: Date;
  data?: Record<string, unknown>;
}

export interface NotificationService {
  scheduleNotification(payload: NotificationPayload): Promise<void>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}

class NoopNotificationService implements NotificationService {
  async scheduleNotification(payload: NotificationPayload): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] scheduleNotification', {
        platform: Platform.OS,
        payload,
      });
    }
  }

  async cancelNotification(id: string): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] cancelNotification', {
        platform: Platform.OS,
        id,
      });
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[NotificationService] cancelAllNotifications', {
        platform: Platform.OS,
      });
    }
  }
}

export const notificationService: NotificationService =
  new NoopNotificationService();

