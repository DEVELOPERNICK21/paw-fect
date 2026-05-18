declare module '@notifee/react-native' {
  export enum AndroidNotificationSetting {
    NOT_SUPPORTED = -1,
    DISABLED = 0,
    ENABLED = 1,
  }

  export const AndroidImportance: {
    readonly DEFAULT: number;
    readonly HIGH: number;
  };

  export const TriggerType: {
    readonly TIMESTAMP: number;
  };

  export const RepeatFrequency: {
    readonly NONE: number;
    readonly HOURLY: number;
    readonly DAILY: number;
    readonly WEEKLY: number;
  };

  export const EventType: {
    readonly UNKNOWN: number;
    readonly DISMISSED: number;
    readonly PRESS: number;
    readonly ACTION_PRESS: number;
    readonly DELIVERED: number;
  };

  export enum AuthorizationStatus {
    NOT_DETERMINED = -1,
    DENIED = 0,
    AUTHORIZED = 1,
    PROVISIONAL = 2,
  }

  export interface AndroidNotificationSettings {
    alarm: AndroidNotificationSetting;
  }

  export interface NotificationSettings {
    authorizationStatus: AuthorizationStatus;
    android: AndroidNotificationSettings;
  }

  export interface TimestampTrigger {
    type: number;
    timestamp: number;
    repeatFrequency?: number;
    alarmManager?: {
      allowWhileIdle?: boolean;
    };
  }

  export interface NotificationRequest {
    id?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
    android?: {
      channelId?: string;
      importance?: number;
      smallIcon?: string;
      largeIcon?: string;
      color?: string;
      pressAction?: {
        id: string;
        launchActivity?: string;
      };
      actions?: NotificationAction[];
    };
    ios?: {
      sound?: string;
      categoryId?: string;
    };
  }

  export interface NotificationAction {
    title: string;
    pressAction: { id: string };
  }

  export interface EventDetail {
    notification?: {
      id?: string;
      title?: string;
      body?: string;
      data?: Record<string, string>;
    };
    pressAction?: {
      id?: string;
    };
  }

  export interface ForegroundEvent {
    type: number;
    detail: EventDetail;
  }

  interface Module {
    createChannel(channel: {
      id: string;
      name: string;
      importance: number;
      sound?: string;
      vibration?: boolean;
    }): Promise<string>;
    requestPermission(): Promise<NotificationSettings>;
    getNotificationSettings(): Promise<NotificationSettings>;
    openAlarmPermissionSettings(): Promise<void>;
    cancelNotification(id: string): Promise<void>;
    cancelAllNotifications(): Promise<void>;
    displayNotification(request: NotificationRequest): Promise<string>;
    getTriggerNotifications(): Promise<
      Array<{
        notification?: NotificationRequest;
        trigger?: TimestampTrigger;
      }>
    >;
    createTriggerNotification(
      request: NotificationRequest,
      trigger: TimestampTrigger,
    ): Promise<string>;
    onBackgroundEvent(
      handler: (event: { type: number; detail: EventDetail }) => void | Promise<void>,
    ): void;
    onForegroundEvent(handler: (event: ForegroundEvent) => void): () => void;
    getInitialNotification(): Promise<{
      notification?: { data?: Record<string, string> };
    } | null>;
    setNotificationCategories(
      categories: Array<{
        id: string;
        actions: Array<{
          id: string;
          title: string;
          foreground?: boolean;
        }>;
      }>,
    ): Promise<void>;
  }

  const notifee: Module;
  export default notifee;
}
