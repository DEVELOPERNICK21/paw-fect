import {
  nextLocalOccurrence,
  nextWeeklyOccurrence,
} from '../dailyCareNotifications';

describe('nextLocalOccurrence', () => {
  it('returns a date in the future', () => {
    const now = Date.now();
    const next = nextLocalOccurrence(12, 30);
    expect(next.getTime()).toBeGreaterThan(now + 1000);
  });
});

describe('nextWeeklyOccurrence', () => {
  it('returns a Sunday when weekday is 0', () => {
    const d = nextWeeklyOccurrence(0, 9, 0);
    expect(d.getDay()).toBe(0);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
    expect(d.getTime()).toBeGreaterThan(Date.now());
  });
});
