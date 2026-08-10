import {
  DEFAULT_TAB_BAR_CORNER_RADIUS,
  DEFAULT_TAB_BAR_SCOOP_DEPTH,
  DEFAULT_TAB_BAR_SCOOP_RADIUS,
  buildPawTabBarShellPath,
} from '../pawTabBarShellPath';

describe('buildPawTabBarShellPath', () => {
  const base = {
    width: 360,
    height: 64,
    cornerRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
    scoopRadius: DEFAULT_TAB_BAR_SCOOP_RADIUS,
    scoopDepth: DEFAULT_TAB_BAR_SCOOP_DEPTH,
  };

  it('returns a closed SVG path string', () => {
    const d = buildPawTabBarShellPath(base);
    expect(d.startsWith('M')).toBe(true);
    expect(d.trim().endsWith('Z') || d.trim().endsWith('z')).toBe(true);
    expect(d).toContain('C'); // scoop uses cubics
  });

  it('clamps corner radius so it cannot exceed half height', () => {
    const d = buildPawTabBarShellPath({
      ...base,
      height: 40,
      cornerRadius: 100,
    });
    expect(d.length).toBeGreaterThan(20);
    expect(d).not.toMatch(/NaN|Infinity/);
  });

  it('clamps scoop so it stays inside the bar width', () => {
    const d = buildPawTabBarShellPath({
      ...base,
      width: 200,
      scoopRadius: 120,
      scoopDepth: 80,
    });
    expect(d).not.toMatch(/NaN|Infinity/);
  });

  it('changes when width changes', () => {
    const a = buildPawTabBarShellPath(base);
    const b = buildPawTabBarShellPath({ ...base, width: 400 });
    expect(a).not.toEqual(b);
  });
});
