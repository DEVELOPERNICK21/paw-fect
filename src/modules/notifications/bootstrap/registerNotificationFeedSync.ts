import { subscribeNotificationFeed } from '../../../infrastructure/notifications/notificationFeedEvents';
import { useNotificationFeedStore } from '../store/notificationFeedStore';

/**
 * Bridges Notifee-side events into the persisted in-app notification feed.
 * Call once when the authenticated app shell is active.
 */
export function registerNotificationFeedSync(): () => void {
  useNotificationFeedStore.getState().pruneScheduleMirrorRows();
  return subscribeNotificationFeed(event => {
    useNotificationFeedStore.getState().applyFeedEvent(event);
  });
}
