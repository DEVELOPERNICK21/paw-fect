import {
  MASCOT_REACTION_PLAY_MS,
  createMascotReactionGate,
} from '../mascotReactions';
import { MASCOT_REACTIONS } from '../mascotTypes';

function clock(start = 1_000): { now: () => number; advance: (ms: number) => void } {
  let t = start;
  return { now: () => t, advance: ms => (t += ms) };
}

describe('mascot reaction gate', () => {
  it('knows how long every reaction plays', () => {
    for (const reaction of MASCOT_REACTIONS) {
      expect(MASCOT_REACTION_PLAY_MS[reaction]).toBeGreaterThan(0);
    }
  });

  it('starts the first reaction', () => {
    const gate = createMascotReactionGate(clock().now);
    expect(gate.active()).toBeNull();
    expect(gate.tryStart('success')).toBe(true);
    expect(gate.active()).toBe('success');
  });

  it('ignores repeated taps while the pet reaction is still playing', () => {
    const c = clock();
    const gate = createMascotReactionGate(c.now);
    expect(gate.tryStart('pet')).toBe(true);
    for (let i = 0; i < 10; i += 1) {
      c.advance(80);
      expect(gate.tryStart('pet')).toBe(false);
    }
  });

  it('allows the same reaction again once it has finished', () => {
    const c = clock();
    const gate = createMascotReactionGate(c.now);
    expect(gate.tryStart('pet')).toBe(true);
    c.advance(MASCOT_REACTION_PLAY_MS.pet - 1);
    expect(gate.tryStart('pet')).toBe(false);
    c.advance(1);
    expect(gate.tryStart('pet')).toBe(true);
  });

  it('lets celebrate take over from success, but not the other way round', () => {
    const c = clock();
    const gate = createMascotReactionGate(c.now);
    expect(gate.tryStart('success')).toBe(true);
    c.advance(300);
    expect(gate.tryStart('celebrate')).toBe(true);
    c.advance(300);
    expect(gate.tryStart('success')).toBe(false);
    expect(gate.active()).toBe('celebrate');
  });

  it('does not let a tap interrupt a success or a celebration', () => {
    const c = clock();
    const gate = createMascotReactionGate(c.now);
    gate.tryStart('success');
    expect(gate.tryStart('pet')).toBe(false);
    c.advance(MASCOT_REACTION_PLAY_MS.success);
    gate.tryStart('celebrate');
    c.advance(500);
    expect(gate.tryStart('pet')).toBe(false);
    expect(gate.tryStart('welcome')).toBe(false);
  });

  it('reset clears the playing reaction', () => {
    const gate = createMascotReactionGate(clock().now);
    gate.tryStart('celebrate');
    gate.reset();
    expect(gate.active()).toBeNull();
    expect(gate.tryStart('pet')).toBe(true);
  });
});
