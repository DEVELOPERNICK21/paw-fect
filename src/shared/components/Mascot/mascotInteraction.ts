import type { MascotMood, MascotReaction } from './mascotTypes';

/**
 * How the mascot behaves under the user's fingers and when left alone. Pure functions only
 * (clock and randomness are injected) so the rules can be tested exactly; `RiveMascot`
 * and `useMascotLife` just apply them.
 */

/** Where the eyes point: -1..1 from the centre, x right, y down. */
export interface Gaze {
  x: number;
  y: number;
}

export const NEUTRAL_GAZE: Gaze = { x: 0, y: 0 };

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/** A touch inside a `size` x `size` box, as a gaze from the box centre. Outside the box is clamped. */
export function gazeFromTouch(locationX: number, locationY: number, size: number): Gaze {
  if (!(size > 0)) {
    return NEUTRAL_GAZE;
  }
  return {
    x: clamp((locationX / size - 0.5) * 2, -1, 1),
    y: clamp((locationY / size - 0.5) * 2, -1, 1),
  };
}

/**
 * Reading along: eyes drop to the field and sweep left to right as more characters are typed.
 * Nothing typed yet looks straight down at the field.
 */
export function gazeForTyping(length: number, maxChars = 20): Gaze {
  if (!(length > 0)) {
    return { x: 0, y: 0.4 };
  }
  const progress = clamp(length / Math.max(1, maxChars), 0, 1);
  return { x: -0.7 + 1.4 * progress, y: 0.35 };
}

/* ------------------------------------------------------------------------------------ */
/* Tap ladder                                                                            */
/* ------------------------------------------------------------------------------------ */

export interface TapStep {
  /** This many taps in a row (each within `windowMs` of the last) reach the step. */
  taps: number;
  reaction: MascotReaction;
}

/** 1 tap: the heart. 3 quick taps: playful sparkles. 6 quick taps: an excited cheer. */
export const DEFAULT_TAP_STEPS: readonly TapStep[] = [
  { taps: 1, reaction: 'pet' },
  { taps: 3, reaction: 'welcome' },
  { taps: 6, reaction: 'celebrate' },
];

export interface TapLadderOptions {
  steps?: readonly TapStep[];
  /** A pause longer than this starts the count again. */
  windowMs?: number;
  /** After the top step, taps only give the first step for this long (the big cheer cannot be spammed). */
  cooldownMs?: number;
  now?: () => number;
}

export interface TapLadder {
  /** Register a tap and get the reaction it earns. */
  tap: () => MascotReaction;
  reset: () => void;
}

export function createTapLadder(options: TapLadderOptions = {}): TapLadder {
  const steps = [...(options.steps ?? DEFAULT_TAP_STEPS)].sort((a, b) => a.taps - b.taps);
  const windowMs = options.windowMs ?? 2500;
  const cooldownMs = options.cooldownMs ?? 6000;
  const now = options.now ?? Date.now;
  const first = steps[0];
  const top = steps[steps.length - 1];

  let count = 0;
  let lastTapAt = Number.NEGATIVE_INFINITY;
  let cooldownUntil = 0;

  return {
    tap: () => {
      const at = now();
      if (at - lastTapAt > windowMs) {
        count = 0;
      }
      lastTapAt = at;
      if (at < cooldownUntil) {
        count = 0;
        return first.reaction;
      }
      count += 1;
      let earned = first.reaction;
      for (const step of steps) {
        if (count >= step.taps) {
          earned = step.reaction;
        }
      }
      if (count >= top.taps) {
        count = 0;
        cooldownUntil = at + cooldownMs;
      }
      return earned;
    },
    reset: () => {
      count = 0;
      lastTapAt = Number.NEGATIVE_INFINITY;
      cooldownUntil = 0;
    },
  };
}

/* ------------------------------------------------------------------------------------ */
/* Idle life                                                                             */
/* ------------------------------------------------------------------------------------ */

export type IdleBeat =
  | { kind: 'glance'; gaze: Gaze; holdMs: number }
  | { kind: 'react'; reaction: MascotReaction };

export interface IdleStep {
  /** Wait this long (from now) and then do `beat`. */
  delayMs: number;
  beat: IdleBeat;
}

export interface IdleLife {
  next: () => IdleStep;
  /** The user did something: start the quiet period again from the first glance. */
  reset: () => void;
}

/** Places a curious character looks at: left, right, down at the content, up and away. */
const GLANCE_TARGETS: readonly Gaze[] = [
  { x: -0.85, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: -0.5, y: 0.6 },
  { x: 0.5, y: 0.6 },
  { x: 0, y: -0.45 },
];

const GLANCE_HOLD_MS = 1300;
const GLANCE_DELAY_MIN_MS = 10000;
const GLANCE_DELAY_SPREAD_MS = 5000;
const REACT_DELAY_MIN_MS = 30000;
const REACT_DELAY_SPREAD_MS = 10000;
/**
 * Three glances, then one "hm?" (the curious reaction), then repeat. The fastest possible cycle is
 * 3 x 10 s + 30 s = 60 s, so there is never more than one unprompted reaction a minute.
 */
const GLANCES_PER_REACTION = 3;

export function createIdleLife(random: () => number = Math.random): IdleLife {
  let beatIndex = 0;
  let lastTarget = -1;

  return {
    next: () => {
      const position = beatIndex % (GLANCES_PER_REACTION + 1);
      beatIndex += 1;
      if (position === GLANCES_PER_REACTION) {
        return {
          delayMs: REACT_DELAY_MIN_MS + Math.floor(random() * REACT_DELAY_SPREAD_MS),
          beat: { kind: 'react', reaction: 'curious' },
        };
      }
      // Never the same direction twice in a row.
      let target = Math.floor(random() * GLANCE_TARGETS.length);
      if (target === lastTarget) {
        target = (target + 1) % GLANCE_TARGETS.length;
      }
      lastTarget = target;
      return {
        delayMs: GLANCE_DELAY_MIN_MS + Math.floor(random() * GLANCE_DELAY_SPREAD_MS),
        beat: { kind: 'glance', gaze: GLANCE_TARGETS[target], holdMs: GLANCE_HOLD_MS },
      };
    },
    reset: () => {
      beatIndex = 0;
    },
  };
}

/**
 * Moods in which the character fidgets when left alone. It does not while asleep, busy
 * (thinking), celebrating, or nudging about something that needs attention.
 */
const IDLE_MOODS: ReadonlySet<MascotMood> = new Set<MascotMood>(['happy', 'wave', 'curious', 'proud']);

export function moodAllowsIdleLife(mood: MascotMood): boolean {
  return IDLE_MOODS.has(mood);
}
