import type { MascotMood, MascotSpecies } from './mascotTypes';

/** All art is authored on a 256 x 256 canvas. */
export const CANVAS = 256;

/** Pivot points (canvas units) the animated rig rotates parts around. */
export const PIVOT = {
  head: { x: 128, y: 150 },
  earL: { x: 68, y: 64 },
  earR: { x: 188, y: 64 },
  tail: { x: 176, y: 216 },
  tag: { x: 128, y: 172 },
  arm: { x: 150, y: 188 },
  bodyBase: { x: 128, y: 238 },
} as const;

export interface Pivots {
  head: { x: number; y: number };
  earL: { x: number; y: number };
  earR: { x: number; y: number };
  tail: { x: number; y: number };
  tag: { x: number; y: number };
  arm: { x: number; y: number };
  bodyBase: { x: number; y: number };
}

/** Rig pivot points per character (canvas units). */
export const PIVOTS: Record<MascotSpecies, Pivots> = {
  dog: {
    head: { x: 128, y: 152 },
    earL: { x: 76, y: 62 },
    earR: { x: 180, y: 62 },
    tail: { x: 190, y: 236 },
    tag: { x: 128, y: 176 },
    arm: { x: 152, y: 208 },
    bodyBase: { x: 128, y: 250 },
  },
  cat: PIVOT,
};

export function pivotsFor(species: MascotSpecies): Pivots {
  return PIVOTS[species];
}

export interface MoodPose {
  /** Head tilt in degrees (positive = clockwise). */
  headTilt: number;
  /** Ear flare in degrees (positive = swings outward / droops). */
  earFlare: number;
  /** Chest-out scale for proud. */
  chest: number;
}

export const MOOD_POSE: Record<MascotMood, MoodPose> = {
  happy: { headTilt: 0, earFlare: 0, chest: 1 },
  wave: { headTilt: -3, earFlare: 2, chest: 1 },
  curious: { headTilt: -8, earFlare: 6, chest: 1 },
  nudge: { headTilt: 4, earFlare: 12, chest: 1 },
  thinking: { headTilt: -4, earFlare: 4, chest: 1 },
  proud: { headTilt: 2, earFlare: 0, chest: 1.04 },
  celebrating: { headTilt: 0, earFlare: 14, chest: 1.03 },
  sleepy: { headTilt: 7, earFlare: 12, chest: 1 },
};

export interface MoodMotion {
  /** Tail wag swing in degrees and half-cycle duration in ms (0 = no wag). */
  tailDeg: number;
  tailMs: number;
  /** Breathing: body scale-Y amplitude and half-cycle ms. */
  breathAmp: number;
  breathMs: number;
  /** Whole-character hop height as a fraction of size (celebrating). */
  hop: number;
  /** Head sway in degrees (thinking, wave). */
  sway: number;
  /** Raised-arm wave swing in degrees (wave only). */
  waveDeg: number;
  /** Whether the character blinks and flicks an ear while idle. */
  idleLife: boolean;
}

export const MOOD_MOTION: Record<MascotMood, MoodMotion> = {
  happy: { tailDeg: 14, tailMs: 380, breathAmp: 0.018, breathMs: 1300, hop: 0, sway: 0, waveDeg: 0, idleLife: true },
  wave: { tailDeg: 16, tailMs: 320, breathAmp: 0.016, breathMs: 1300, hop: 0, sway: 2, waveDeg: 16, idleLife: true },
  curious: { tailDeg: 8, tailMs: 600, breathAmp: 0.016, breathMs: 1400, hop: 0, sway: 0, waveDeg: 0, idleLife: true },
  nudge: { tailDeg: 4, tailMs: 900, breathAmp: 0.014, breathMs: 1500, hop: 0, sway: 0, waveDeg: 0, idleLife: true },
  thinking: { tailDeg: 6, tailMs: 800, breathAmp: 0.014, breathMs: 1500, hop: 0, sway: 3, waveDeg: 0, idleLife: true },
  proud: { tailDeg: 12, tailMs: 420, breathAmp: 0.02, breathMs: 1500, hop: 0, sway: 0, waveDeg: 0, idleLife: true },
  celebrating: { tailDeg: 22, tailMs: 180, breathAmp: 0.012, breathMs: 600, hop: 0.07, sway: 0, waveDeg: 0, idleLife: false },
  sleepy: { tailDeg: 0, tailMs: 0, breathAmp: 0.03, breathMs: 2000, hop: 0, sway: 0, waveDeg: 0, idleLife: false },
};
