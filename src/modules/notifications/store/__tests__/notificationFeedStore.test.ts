import {
  selectUnreadVisibleCount,
  type InAppNotificationFeedItem,
} from '../notificationFeedStore';

function item(
  patch: Partial<InAppNotificationFeedItem> & { id: string },
): InAppNotificationFeedItem {
  return {
    title: 'Notice',
    body: '',
    data: {},
    loggedAt: '2026-08-17T10:00:00.000Z',
    read: false,
    dismissed: false,
    ...patch,
  };
}

describe('selectUnreadVisibleCount', () => {
  it('counts only visible unread items', () => {
    const items = {
      a: item({ id: 'a', read: false }),
      b: item({ id: 'b', read: true }),
      c: item({ id: 'c', read: false, dismissed: true }),
    };
    expect(selectUnreadVisibleCount(items)).toBe(1);
  });

  it('returns 0 for an empty feed', () => {
    expect(selectUnreadVisibleCount({})).toBe(0);
  });
});
