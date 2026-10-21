import { fluffPath, jitter, strandPath } from '../furGeometry';

describe('furGeometry', () => {
  const base = { cx: 100, cy: 100, rx: 50, ry: 40, tufts: 12, depth: 0.1 };

  it('is deterministic: the same inputs always give the same path', () => {
    expect(fluffPath(base)).toBe(fluffPath(base));
    expect(jitter(3, 7)).toBe(jitter(3, 7));
  });

  it('builds a closed path with one curve segment per tuft in cloud style', () => {
    const d = fluffPath({ ...base, style: 'cloud' });
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect((d.match(/Q/g) ?? []).length).toBe(base.tufts);
  });

  it('uses two curve segments per tuft in swept tuft style', () => {
    const d = fluffPath({ ...base, style: 'tuft' });
    expect((d.match(/Q/g) ?? []).length).toBe(base.tufts * 2);
  });

  it('keeps every coordinate finite and near the shape', () => {
    const nums = fluffPath(base).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    expect(nums.length).toBeGreaterThan(0);
    nums.forEach(n => {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(200);
    });
  });

  it('varies tuft size with the seed but not the tuft count', () => {
    const a = fluffPath({ ...base, seed: 1 });
    const b = fluffPath({ ...base, seed: 2 });
    expect(a).not.toBe(b);
    expect((a.match(/Q/g) ?? []).length).toBe((b.match(/Q/g) ?? []).length);
  });

  it('emits one stroke per strand', () => {
    expect((strandPath(100, 100, 40, 0, 90, 5, 6).match(/M/g) ?? []).length).toBe(5);
  });
});
