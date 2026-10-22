/**
 * The Buddy Bond: the friendship between the user and the app's character.
 *
 * Every genuinely completed care task earns bond points (XP). Points raise the
 * bond level; levels earn a title and a celebration. It only ever goes up, so
 * there is nothing to lose and nobody is shamed for a missed day.
 *
 * Pure: no storage, no React.
 */
export const XP_PER_TASK = 10;
/** Extra points the first time every task for a pet's day is done. */
export const XP_DAY_BONUS = 25;
/** Each streak day adds this much to the day bonus, up to `MAX_STREAK_BONUS_DAYS`. */
export const XP_PER_STREAK_DAY = 2;
export const MAX_STREAK_BONUS_DAYS = 10;

const TITLES = [
  'New Friend',
  'Care Buddy',
  'Trusty Pal',
  'Care Champ',
  'Best Friend',
  'Pawfect Parent',
] as const;

/** Total points needed to reach `level` (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 25 * n * (n - 1);
}

export function levelForXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 1;
  while (xpForLevel(level + 1) <= safe) {
    level += 1;
  }
  return level;
}

export function titleForLevel(level: number): string {
  return TITLES[Math.min(Math.max(level, 1), TITLES.length) - 1];
}

export interface BondProgress {
  xp: number;
  level: number;
  title: string;
  nextTitle: string;
  /** Points earned within the current level. */
  into: number;
  /** Points needed to span the current level. */
  span: number;
  /** 0..1 */
  ratio: number;
  toNext: number;
}

export function bondProgress(xp: number): BondProgress {
  const safe = Math.max(0, Math.floor(xp));
  const level = levelForXp(safe);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const span = end - start;
  const into = safe - start;
  return {
    xp: safe,
    level,
    title: titleForLevel(level),
    nextTitle: titleForLevel(level + 1),
    into,
    span,
    ratio: span > 0 ? into / span : 0,
    toNext: end - safe,
  };
}

/** Points for one completed task. `dayCompleted` adds the day bonus. */
export function xpForCompletion(params: {
  dayCompleted: boolean;
  streakDays: number;
}): number {
  if (!params.dayCompleted) {
    return XP_PER_TASK;
  }
  const streak = Math.min(
    Math.max(params.streakDays, 0),
    MAX_STREAK_BONUS_DAYS,
  );
  return XP_PER_TASK + XP_DAY_BONUS + streak * XP_PER_STREAK_DAY;
}
