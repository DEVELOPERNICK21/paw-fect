import { CANVAS, MOOD_MOTION, MOOD_POSE, PIVOT } from '../mascotRig';
import { MASCOT_MOODS } from '../mascotTypes';

describe('mascot rig data', () => {
  it('defines a pose and a motion profile for every mood', () => {
    for (const mood of MASCOT_MOODS) {
      expect(MOOD_POSE[mood]).toBeDefined();
      expect(MOOD_MOTION[mood]).toBeDefined();
    }
  });

  it('keeps every pivot inside the 256 canvas', () => {
    for (const p of Object.values(PIVOT)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(CANVAS);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(CANVAS);
    }
  });

  it('only waves in the wave mood and only hops when celebrating', () => {
    for (const mood of MASCOT_MOODS) {
      expect(MOOD_MOTION[mood].waveDeg > 0).toBe(mood === 'wave');
      expect(MOOD_MOTION[mood].hop > 0).toBe(mood === 'celebrating');
    }
  });

  it('keeps motion gentle: no mood swings the tail past 25 degrees', () => {
    for (const mood of MASCOT_MOODS) {
      expect(MOOD_MOTION[mood].tailDeg).toBeLessThanOrEqual(25);
    }
  });
});
