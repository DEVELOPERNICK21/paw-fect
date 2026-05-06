import { calendarDaysBetweenIsoDates } from '../calendarDate';

describe('dateTimezone (TZ)', () => {
  it('TZ-03 / TZ-04: calendarDaysBetweenIsoDates uses UTC date parts (DST-safe day counts)', () => {
    expect(calendarDaysBetweenIsoDates('2024-03-09', '2024-03-11')).toBe(2);
    expect(calendarDaysBetweenIsoDates('2024-01-01', '2024-01-01')).toBe(0);
  });

  it('TZ-04: India-relevant spacing uses same calendar math as YYYY-MM-DD strings (no raw ms diff here)', () => {
    expect(calendarDaysBetweenIsoDates('2026-01-01', '2026-07-01')).toBe(181);
  });
});
