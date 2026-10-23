import type { MascotReaction } from '../../../../shared/components/Mascot/mascotTypes';

/**
 * The companion's memory of you, and the rules for when it says hello. Being recognised is
 * what makes a character feel like someone: it greets you once a day, notices when you have
 * been away, and remembers the pet's birthday. Restraint matters as much: it never greets twice
 * a day, never at night, and never reproaches.
 *
 * Pure: the clock is passed in. Persistence lives in `mascotMemoryStore`.
 */
export interface MascotMemory {
  /** ISO time of the last Home visit. */
  lastOpenedAt: string | null;
  /** Local date (YYYY-MM-DD) of the last greeting, or of the first-ever visit. */
  lastGreetedYmd: string | null;
  /** The year whose birthday has already been celebrated. */
  lastBirthdayYear: number | null;
}

export const EMPTY_MASCOT_MEMORY: MascotMemory = {
  lastOpenedAt: null,
  lastGreetedYmd: null,
  lastBirthdayYear: null,
};

export type HomeGreetingKind = 'daily' | 'welcomeBack' | 'birthday';

export interface HomeGreeting {
  kind: HomeGreetingKind;
  reaction: MascotReaction;
  /** Whole days since the last visit (welcome back). */
  daysAway?: number;
  /** The pet's age in whole years (birthday). */
  age?: number;
}

/** Away this many whole days or more and the next visit is a "welcome back". */
export const WELCOME_BACK_AFTER_DAYS = 3;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function localYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole local calendar days from `fromIso` to `now`; 0 for an unreadable or future time. */
export function daysBetween(fromIso: string, now: Date): number {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) {
    return 0;
  }
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * The pet's age in whole years if today is its birthday (and it is at least one year old),
 * otherwise `null`. A 29 February birthday is kept on 28 February in a common year.
 */
export function birthdayAge(dob: string | null | undefined, now: Date): number | null {
  const match = dob == null ? null : /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
  if (match == null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  const leapBorn = month === 2 && day === 29;
  const sameDay =
    leapBorn && !isLeapYear(today.y)
      ? today.m === 2 && today.d === 28
      : today.m === month && today.d === day;
  const age = today.y - year;
  return sameDay && age >= 1 ? age : null;
}

/** The daily hello is for daytime and evening; a 2 a.m. visit is left alone (the mood is sleepy anyway). */
export function isGreetingHour(now: Date): boolean {
  const hour = now.getHours();
  return hour >= 5 && hour < 22;
}

export interface GreetingInput {
  now: Date;
  memory: MascotMemory;
  petDob?: string | null;
  hasPet: boolean;
}

/**
 * What, if anything, the companion does on arriving at Home. At most one thing:
 * birthday, then welcome back, then the daily hello.
 */
export function decideHomeGreeting({ now, memory, petDob, hasPet }: GreetingInput): HomeGreeting | null {
  if (!hasPet) {
    return null;
  }
  const age = birthdayAge(petDob, now);
  if (age != null && memory.lastBirthdayYear !== now.getFullYear()) {
    return { kind: 'birthday', reaction: 'celebrate', age };
  }
  if (memory.lastOpenedAt == null) {
    // The first Home visit comes straight after onboarding, which already said hello.
    return null;
  }
  const daysAway = daysBetween(memory.lastOpenedAt, now);
  if (daysAway >= WELCOME_BACK_AFTER_DAYS) {
    return { kind: 'welcomeBack', reaction: 'welcome', daysAway };
  }
  if (memory.lastGreetedYmd !== localYmd(now) && isGreetingHour(now)) {
    return { kind: 'daily', reaction: 'welcome' };
  }
  return null;
}

/** The memory after a Home visit that produced `greeting` (or none). */
export function applyHomeVisit(memory: MascotMemory, greeting: HomeGreeting | null, now: Date): MascotMemory {
  return {
    lastOpenedAt: now.toISOString(),
    // Greeted, or the very first visit (already welcomed by onboarding): today's hello is done.
    lastGreetedYmd: greeting != null || memory.lastOpenedAt == null ? localYmd(now) : memory.lastGreetedYmd,
    lastBirthdayYear: greeting?.kind === 'birthday' ? now.getFullYear() : memory.lastBirthdayYear,
  };
}

/** Anything read back from storage, reduced to a valid memory (corrupt fields become empty). */
export function parseMascotMemory(raw: unknown): MascotMemory {
  if (raw == null || typeof raw !== 'object') {
    return EMPTY_MASCOT_MEMORY;
  }
  const value = raw as Record<string, unknown>;
  const text = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
  const opened = text(value.lastOpenedAt);
  return {
    lastOpenedAt: opened != null && !Number.isNaN(new Date(opened).getTime()) ? opened : null,
    lastGreetedYmd: text(value.lastGreetedYmd),
    lastBirthdayYear:
      typeof value.lastBirthdayYear === 'number' && Number.isInteger(value.lastBirthdayYear)
        ? value.lastBirthdayYear
        : null,
  };
}
