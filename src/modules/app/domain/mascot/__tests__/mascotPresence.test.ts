import {
  applyHomeVisit,
  birthdayAge,
  daysBetween,
  decideHomeGreeting,
  EMPTY_MASCOT_MEMORY,
  isGreetingHour,
  localYmd,
  parseMascotMemory,
  WELCOME_BACK_AFTER_DAYS,
  type MascotMemory,
} from '../mascotPresence';

// Local-time constructors so the tests do not depend on the machine's time zone.
const at = (y: number, m: number, d: number, h = 9, min = 0): Date => new Date(y, m - 1, d, h, min, 0);
const iso = (d: Date): string => d.toISOString();
const memory = (over: Partial<MascotMemory> = {}): MascotMemory => ({ ...EMPTY_MASCOT_MEMORY, ...over });

describe('localYmd / daysBetween', () => {
  it('formats the local calendar date', () => {
    expect(localYmd(at(2026, 3, 5))).toBe('2026-03-05');
    expect(localYmd(at(2026, 12, 31, 23, 59))).toBe('2026-12-31');
  });

  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysBetween(iso(at(2026, 5, 1, 23, 50)), at(2026, 5, 2, 0, 10))).toBe(1);
    expect(daysBetween(iso(at(2026, 5, 1, 0, 10)), at(2026, 5, 1, 23, 50))).toBe(0);
    expect(daysBetween(iso(at(2026, 5, 1)), at(2026, 5, 8))).toBe(7);
  });

  it('crosses month and year ends', () => {
    expect(daysBetween(iso(at(2025, 12, 30)), at(2026, 1, 2))).toBe(3);
  });

  it('is 0 for garbage or a time in the future', () => {
    expect(daysBetween('not a date', at(2026, 5, 1))).toBe(0);
    expect(daysBetween(iso(at(2026, 6, 1)), at(2026, 5, 1))).toBe(0);
  });
});

describe('birthdayAge', () => {
  it('is the age in whole years on the birthday', () => {
    expect(birthdayAge('2023-07-14', at(2026, 7, 14))).toBe(3);
    expect(birthdayAge('2025-07-14', at(2026, 7, 14))).toBe(1);
  });

  it('is null on any other day', () => {
    expect(birthdayAge('2023-07-14', at(2026, 7, 13))).toBeNull();
    expect(birthdayAge('2023-07-14', at(2026, 7, 15))).toBeNull();
    expect(birthdayAge('2023-07-14', at(2026, 8, 14))).toBeNull();
  });

  it('is null for a pet born this year (no first-birthday on the day it arrives)', () => {
    expect(birthdayAge('2026-07-14', at(2026, 7, 14))).toBeNull();
  });

  it('reads a full ISO timestamp, as stored on the pet', () => {
    expect(birthdayAge('2023-07-14T00:00:00.000Z', at(2026, 7, 14))).toBe(3);
  });

  it('keeps a 29 February birthday on 28 February in a common year, and on the 29th in a leap year', () => {
    expect(birthdayAge('2020-02-29', at(2026, 2, 28))).toBe(6);
    expect(birthdayAge('2020-02-29', at(2026, 3, 1))).toBeNull();
    expect(birthdayAge('2020-02-29', at(2028, 2, 29))).toBe(8);
    expect(birthdayAge('2020-02-29', at(2028, 2, 28))).toBeNull();
  });

  it('is null for a missing, empty or unreadable birthday', () => {
    expect(birthdayAge(undefined, at(2026, 7, 14))).toBeNull();
    expect(birthdayAge(null, at(2026, 7, 14))).toBeNull();
    expect(birthdayAge('', at(2026, 7, 14))).toBeNull();
    expect(birthdayAge('14/07/2023', at(2026, 7, 14))).toBeNull();
  });
});

describe('isGreetingHour', () => {
  it('greets from 5 a.m. to before 10 p.m.', () => {
    expect(isGreetingHour(at(2026, 5, 1, 4, 59))).toBe(false);
    expect(isGreetingHour(at(2026, 5, 1, 5, 0))).toBe(true);
    expect(isGreetingHour(at(2026, 5, 1, 21, 59))).toBe(true);
    expect(isGreetingHour(at(2026, 5, 1, 22, 0))).toBe(false);
  });
});

describe('decideHomeGreeting', () => {
  const base = { hasPet: true, petDob: '2022-01-10' };
  const visited = (daysAgo: number, now: Date, over: Partial<MascotMemory> = {}): MascotMemory =>
    memory({ lastOpenedAt: iso(new Date(now.getTime() - daysAgo * 86_400_000)), lastGreetedYmd: '2000-01-01', ...over });

  it('does nothing without a pet', () => {
    const now = at(2026, 5, 1);
    expect(decideHomeGreeting({ now, memory: visited(10, now), hasPet: false })).toBeNull();
  });

  it('does nothing on the very first Home visit (onboarding already said hello)', () => {
    expect(decideHomeGreeting({ ...base, now: at(2026, 5, 1), memory: EMPTY_MASCOT_MEMORY })).toBeNull();
  });

  it('says the daily hello on the first visit of a new day', () => {
    const now = at(2026, 5, 2, 8);
    const greeting = decideHomeGreeting({ ...base, now, memory: visited(1, now) });
    expect(greeting).toEqual({ kind: 'daily', reaction: 'welcome' });
  });

  it('only once a day', () => {
    const now = at(2026, 5, 2, 8);
    expect(decideHomeGreeting({ ...base, now, memory: visited(0, now, { lastGreetedYmd: localYmd(now) }) })).toBeNull();
  });

  it('leaves a night-time visit alone, so the hello is still there in the morning', () => {
    const night = at(2026, 5, 2, 1);
    expect(decideHomeGreeting({ ...base, now: night, memory: visited(1, night) })).toBeNull();
    const morning = at(2026, 5, 2, 7);
    expect(decideHomeGreeting({ ...base, now: morning, memory: visited(1, morning) })?.kind).toBe('daily');
  });

  it('welcomes you back after three or more days away, with the days counted', () => {
    const now = at(2026, 5, 10, 9);
    // the rule is "3 whole days", written as plain numbers so changing it breaks this test
    expect(WELCOME_BACK_AFTER_DAYS).toBe(3);
    expect(decideHomeGreeting({ ...base, now, memory: visited(2, now) })?.kind).toBe('daily');
    const away = decideHomeGreeting({ ...base, now, memory: visited(3, now) });
    expect(away).toEqual({ kind: 'welcomeBack', reaction: 'welcome', daysAway: 3 });
    expect(decideHomeGreeting({ ...base, now, memory: visited(20, now) })).toMatchObject({ kind: 'welcomeBack', daysAway: 20 });
  });

  it('welcomes you back even late at night (you only just arrived)', () => {
    const now = at(2026, 5, 10, 23);
    expect(decideHomeGreeting({ ...base, now, memory: visited(5, now) })?.kind).toBe('welcomeBack');
  });

  it('celebrates the birthday, with the age, and that wins over everything else', () => {
    const now = at(2026, 1, 10, 9);
    const greeting = decideHomeGreeting({ ...base, now, memory: visited(30, now) });
    expect(greeting).toEqual({ kind: 'birthday', reaction: 'celebrate', age: 4 });
  });

  it('celebrates a birthday on the very first Home visit too', () => {
    const now = at(2026, 1, 10, 9);
    expect(decideHomeGreeting({ ...base, now, memory: EMPTY_MASCOT_MEMORY })?.kind).toBe('birthday');
  });

  it('celebrates each birthday once, and again next year', () => {
    const now = at(2026, 1, 10, 9);
    const done = visited(0, now, { lastBirthdayYear: 2026, lastGreetedYmd: localYmd(now) });
    expect(decideHomeGreeting({ ...base, now, memory: done })).toBeNull();
    const nextYear = at(2027, 1, 10, 9);
    expect(decideHomeGreeting({ ...base, now: nextYear, memory: done })?.kind).toBe('birthday');
  });

  it('after a birthday greeting the same day, there is no second daily hello', () => {
    const now = at(2026, 1, 10, 9);
    const after = applyHomeVisit(visited(1, now), decideHomeGreeting({ ...base, now, memory: visited(1, now) }), now);
    expect(decideHomeGreeting({ ...base, now: at(2026, 1, 10, 18), memory: after })).toBeNull();
  });
});

describe('applyHomeVisit', () => {
  it('records the visit time and the greeting day', () => {
    const now = at(2026, 5, 2, 8);
    const next = applyHomeVisit(memory({ lastOpenedAt: iso(at(2026, 5, 1)) }), { kind: 'daily', reaction: 'welcome' }, now);
    expect(next.lastOpenedAt).toBe(iso(now));
    expect(next.lastGreetedYmd).toBe('2026-05-02');
  });

  it('marks the first-ever visit as greeted so there is no second hello that day', () => {
    const now = at(2026, 5, 2, 8);
    const next = applyHomeVisit(EMPTY_MASCOT_MEMORY, null, now);
    expect(next.lastGreetedYmd).toBe('2026-05-02');
    expect(decideHomeGreeting({ now: at(2026, 5, 2, 18), memory: next, hasPet: true })).toBeNull();
  });

  it('does not use up the daily hello on a night-time visit with no greeting', () => {
    const night = at(2026, 5, 3, 1);
    const before = memory({ lastOpenedAt: iso(at(2026, 5, 2, 20)), lastGreetedYmd: '2026-05-02' });
    const next = applyHomeVisit(before, null, night);
    expect(next.lastGreetedYmd).toBe('2026-05-02');
    expect(next.lastOpenedAt).toBe(iso(night));
  });

  it('remembers a celebrated birthday year', () => {
    const now = at(2026, 1, 10);
    expect(applyHomeVisit(EMPTY_MASCOT_MEMORY, { kind: 'birthday', reaction: 'celebrate', age: 4 }, now).lastBirthdayYear).toBe(2026);
    expect(applyHomeVisit(memory({ lastBirthdayYear: 2025 }), { kind: 'daily', reaction: 'welcome' }, now).lastBirthdayYear).toBe(2025);
  });

  it('does not mutate the memory it was given', () => {
    const before = memory({ lastOpenedAt: iso(at(2026, 5, 1)) });
    const copy = { ...before };
    applyHomeVisit(before, { kind: 'daily', reaction: 'welcome' }, at(2026, 5, 2));
    expect(before).toEqual(copy);
  });
});

describe('parseMascotMemory', () => {
  it('accepts a valid memory unchanged', () => {
    const good = memory({ lastOpenedAt: iso(at(2026, 5, 1)), lastGreetedYmd: '2026-05-01', lastBirthdayYear: 2026 });
    expect(parseMascotMemory(good)).toEqual(good);
  });

  it('turns anything else into an empty memory instead of crashing', () => {
    for (const bad of [null, undefined, 5, 'x', [], true]) {
      expect(parseMascotMemory(bad)).toEqual(EMPTY_MASCOT_MEMORY);
    }
  });

  it('drops only the corrupt fields', () => {
    const parsed = parseMascotMemory({ lastOpenedAt: 'garbage', lastGreetedYmd: '2026-05-01', lastBirthdayYear: '2026' });
    expect(parsed).toEqual({ lastOpenedAt: null, lastGreetedYmd: '2026-05-01', lastBirthdayYear: null });
  });
});
