export type NotificationFeedScheduledPayload = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  scheduledForIso: string;
};

export type NotificationFeedDisplayedPayload = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  deliveredAtIso: string;
};

export type NotificationFeedDeliveredPayload = {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
  deliveredAtIso: string;
};

export type NotificationFeedEvent =
  | { type: 'scheduled'; payload: NotificationFeedScheduledPayload }
  | { type: 'displayed'; payload: NotificationFeedDisplayedPayload }
  | { type: 'delivered'; payload: NotificationFeedDeliveredPayload };

type Handler = (event: NotificationFeedEvent) => void;

let handlers: Handler[] = [];

export function subscribeNotificationFeed(handler: Handler): () => void {
  handlers = [...handlers, handler];
  return () => {
    handlers = handlers.filter(h => h !== handler);
  };
}

export function emitNotificationFeedEvent(event: NotificationFeedEvent): void {
  const snapshot = [...handlers];
  for (const h of snapshot) {
    try {
      h(event);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[notificationFeedEvents] handler error', error);
      }
    }
  }
}
