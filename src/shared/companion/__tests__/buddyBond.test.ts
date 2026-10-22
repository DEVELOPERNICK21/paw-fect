import {
  bondProgress,
  levelForXp,
  titleForLevel,
  xpForCompletion,
  xpForLevel,
} from '../buddyBond';

describe('buddyBond', () => {
  it('has a smooth, increasing level curve', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 50, 150, 300, 500]);
  });

  it('maps xp to level at the boundaries', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(149)).toBe(2);
    expect(levelForXp(150)).toBe(3);
    expect(levelForXp(-20)).toBe(1);
  });

  it('reports progress within the level', () => {
    const p = bondProgress(100);
    expect(p).toMatchObject({ level: 2, title: 'Care Buddy', into: 50, span: 100, toNext: 50 });
    expect(p.ratio).toBeCloseTo(0.5);
    expect(p.nextTitle).toBe('Trusty Pal');
  });

  it('caps titles at the last one', () => {
    expect(titleForLevel(1)).toBe('New Friend');
    expect(titleForLevel(99)).toBe('Pawfect Parent');
  });

  it('awards a flat amount per task and a bonus for a finished day', () => {
    expect(xpForCompletion({ dayCompleted: false, streakDays: 5 })).toBe(10);
    expect(xpForCompletion({ dayCompleted: true, streakDays: 0 })).toBe(35);
    expect(xpForCompletion({ dayCompleted: true, streakDays: 3 })).toBe(41);
    expect(xpForCompletion({ dayCompleted: true, streakDays: 99 })).toBe(55);
  });
});
