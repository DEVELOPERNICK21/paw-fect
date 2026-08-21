import { formatTabBadgeCount } from '../tabBarBadge';

describe('formatTabBadgeCount', () => {
  it('hides the badge when there are no unread items', () => {
    expect(formatTabBadgeCount(0)).toBeNull();
    expect(formatTabBadgeCount(-1)).toBeNull();
  });

  it('shows the exact count through 9', () => {
    expect(formatTabBadgeCount(1)).toBe('1');
    expect(formatTabBadgeCount(9)).toBe('9');
  });

  it('caps larger counts so the chip stays two characters', () => {
    expect(formatTabBadgeCount(10)).toBe('9+');
    expect(formatTabBadgeCount(99)).toBe('9+');
  });
});
