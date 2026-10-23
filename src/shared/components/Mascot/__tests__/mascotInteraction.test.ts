import {
  createIdleLife,
  createTapLadder,
  DEFAULT_TAP_STEPS,
  gazeForTyping,
  gazeFromTouch,
  moodAllowsIdleLife,
  type IdleStep,
} from '../mascotInteraction';
import { MASCOT_MOODS, MASCOT_REACTIONS } from '../mascotTypes';

describe('gazeFromTouch', () => {
  it('centre is neutral, corners reach +-1', () => {
    expect(gazeFromTouch(50, 50, 100)).toEqual({ x: 0, y: 0 });
    expect(gazeFromTouch(0, 0, 100)).toEqual({ x: -1, y: -1 });
    expect(gazeFromTouch(100, 100, 100)).toEqual({ x: 1, y: 1 });
  });

  it('maps a quarter point proportionally', () => {
    const g = gazeFromTouch(75, 25, 100);
    expect(g.x).toBeCloseTo(0.5, 6);
    expect(g.y).toBeCloseTo(-0.5, 6);
  });

  it('clamps a finger that has dragged outside the box', () => {
    expect(gazeFromTouch(400, -300, 100)).toEqual({ x: 1, y: -1 });
  });

  it('is neutral for a zero or invalid size instead of dividing by zero', () => {
    expect(gazeFromTouch(10, 10, 0)).toEqual({ x: 0, y: 0 });
    expect(gazeFromTouch(10, 10, Number.NaN)).toEqual({ x: 0, y: 0 });
  });
});

describe('gazeForTyping', () => {
  it('looks straight down at the field before anything is typed', () => {
    expect(gazeForTyping(0)).toEqual({ x: 0, y: 0.4 });
  });

  it('starts at the left and sweeps right as characters are added', () => {
    const one = gazeForTyping(1).x;
    const ten = gazeForTyping(10).x;
    const twenty = gazeForTyping(20).x;
    expect(one).toBeLessThan(ten);
    expect(ten).toBeLessThan(twenty);
    expect(one).toBeGreaterThanOrEqual(-0.7);
    expect(twenty).toBeCloseTo(0.7, 6);
  });

  it('stops at the right edge for long text and never leaves -1..1', () => {
    expect(gazeForTyping(500)).toEqual(gazeForTyping(20));
    for (const n of [0, 1, 7, 20, 99]) {
      const g = gazeForTyping(n, 20);
      expect(Math.abs(g.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.y)).toBeLessThanOrEqual(1);
    }
  });

  it('honours a different field length', () => {
    expect(gazeForTyping(5, 10).x).toBeCloseTo(0, 6);
  });
});

describe('tap ladder', () => {
  const clock = (): { now: () => number; advance: (ms: number) => void } => {
    let t = 1000;
    return {
      now: () => t,
      advance: ms => {
        t += ms;
      },
    };
  };

  it('one tap is the heart', () => {
    const c = clock();
    expect(createTapLadder({ now: c.now }).tap()).toBe('pet');
  });

  it('escalates 1 -> 3 -> 6 quick taps: pet, playful, then the excited cheer', () => {
    const c = clock();
    const ladder = createTapLadder({ now: c.now });
    const seen: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      seen.push(ladder.tap());
      c.advance(300);
    }
    expect(seen).toEqual(['pet', 'pet', 'welcome', 'welcome', 'welcome', 'celebrate']);
  });

  it('a pause longer than the window starts the count again', () => {
    const c = clock();
    const ladder = createTapLadder({ now: c.now, windowMs: 2500 });
    ladder.tap();
    c.advance(300);
    ladder.tap();
    c.advance(300);
    expect(ladder.tap()).toBe('welcome');
    c.advance(2600);
    expect(ladder.tap()).toBe('pet');
    c.advance(300);
    expect(ladder.tap()).toBe('pet');
  });

  it('the big cheer cannot be spammed: a cooldown gives only the heart', () => {
    const c = clock();
    const ladder = createTapLadder({ now: c.now, cooldownMs: 6000 });
    for (let i = 0; i < 6; i += 1) {
      ladder.tap();
      c.advance(200);
    }
    // straight after the cheer, even a fast burst stays at the heart
    const burst = [] as string[];
    for (let i = 0; i < 8; i += 1) {
      burst.push(ladder.tap());
      c.advance(200);
    }
    expect(new Set(burst)).toEqual(new Set(['pet']));
  });

  it('can reach the cheer again after the cooldown has passed', () => {
    const c = clock();
    const ladder = createTapLadder({ now: c.now, cooldownMs: 6000 });
    for (let i = 0; i < 6; i += 1) {
      ladder.tap();
      c.advance(200);
    }
    c.advance(7000);
    const second: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      second.push(ladder.tap());
      c.advance(200);
    }
    expect(second[5]).toBe('celebrate');
  });

  it('reset clears the count and the cooldown', () => {
    const c = clock();
    const ladder = createTapLadder({ now: c.now });
    ladder.tap();
    c.advance(100);
    ladder.tap();
    ladder.reset();
    c.advance(100);
    expect(ladder.tap()).toBe('pet');
  });

  it('works with custom steps, in any order', () => {
    const c = clock();
    const ladder = createTapLadder({
      now: c.now,
      steps: [
        { taps: 2, reaction: 'success' },
        { taps: 1, reaction: 'pet' },
      ],
    });
    expect(ladder.tap()).toBe('pet');
    c.advance(100);
    expect(ladder.tap()).toBe('success');
  });

  it('only ever earns reactions the mascot really has', () => {
    for (const step of DEFAULT_TAP_STEPS) {
      expect(MASCOT_REACTIONS).toContain(step.reaction);
    }
  });
});

describe('idle life', () => {
  const seeded = (values: number[]): (() => number) => {
    let i = 0;
    return () => values[i++ % values.length];
  };
  const take = (random: () => number, n: number): IdleStep[] => {
    const life = createIdleLife(random);
    return Array.from({ length: n }, () => life.next());
  };

  it('glances three times, then one curious reaction, then repeats', () => {
    const steps = take(seeded([0.1, 0.5, 0.9]), 8);
    expect(steps.map(s => s.beat.kind)).toEqual([
      'glance', 'glance', 'glance', 'react', 'glance', 'glance', 'glance', 'react',
    ]);
    const reactions = steps.filter(s => s.beat.kind === 'react').map(s => (s.beat.kind === 'react' ? s.beat.reaction : ''));
    expect(reactions).toEqual(['curious', 'curious']);
  });

  it('waits a believable time: 10-15 s before a glance, 30-40 s before the curious reaction', () => {
    for (const r of [0, 0.5, 0.999]) {
      for (const step of take(() => r, 8)) {
        if (step.beat.kind === 'glance') {
          expect(step.delayMs).toBeGreaterThanOrEqual(10000);
          expect(step.delayMs).toBeLessThan(15000);
        } else {
          expect(step.delayMs).toBeGreaterThanOrEqual(30000);
          expect(step.delayMs).toBeLessThan(40000);
        }
      }
    }
  });

  it('so there is at most one reaction a minute', () => {
    const worst = take(() => 0, 4).reduce((sum, s) => sum + s.delayMs, 0); // fastest possible cycle
    expect(worst).toBeGreaterThanOrEqual(60000);
  });

  it('never looks the same way twice in a row, even with a stuck random source', () => {
    const steps = take(() => 0, 12).filter(s => s.beat.kind === 'glance');
    for (let i = 1; i < steps.length; i += 1) {
      const a = steps[i - 1].beat;
      const b = steps[i].beat;
      if (a.kind === 'glance' && b.kind === 'glance') {
        expect(`${b.gaze.x},${b.gaze.y}`).not.toBe(`${a.gaze.x},${a.gaze.y}`);
      }
    }
  });

  it('every glance stays inside -1..1 and holds for about a second', () => {
    for (const step of take(Math.random, 40)) {
      if (step.beat.kind === 'glance') {
        expect(Math.abs(step.beat.gaze.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(step.beat.gaze.y)).toBeLessThanOrEqual(1);
        expect(step.beat.holdMs).toBeGreaterThan(500);
        expect(step.beat.holdMs).toBeLessThan(3000);
      }
    }
  });

  it('reset starts the quiet period over from a glance, not from the reaction', () => {
    const life = createIdleLife(() => 0.3);
    life.next();
    life.next();
    life.next(); // the next one would be the reaction
    life.reset();
    expect(life.next().beat.kind).toBe('glance');
  });
});

describe('moodAllowsIdleLife', () => {
  it('fidgets only in calm, awake moods', () => {
    const allowed = MASCOT_MOODS.filter(moodAllowsIdleLife);
    expect(allowed.sort()).toEqual(['curious', 'happy', 'proud', 'wave']);
  });

  it('stays still while asleep, busy, celebrating or nudging', () => {
    for (const mood of ['sleepy', 'thinking', 'celebrating', 'nudge'] as const) {
      expect(moodAllowsIdleLife(mood)).toBe(false);
    }
  });
});
