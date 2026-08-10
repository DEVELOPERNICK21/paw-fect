import {
  DEFAULT_TAB_BAR_CORNER_RADIUS,
  DEFAULT_TAB_BAR_SCOOP_DEPTH,
  DEFAULT_TAB_BAR_SCOOP_RADIUS,
  FAB_OVERHANG,
  FAB_SIZE,
  buildPawTabBarShellPath,
  getTabBarFabGapWidth,
} from '../pawTabBarShellPath';

describe('pawTabBarShellPath constants', () => {
  it('scoop depth matches FAB dip into bar', () => {
    expect(DEFAULT_TAB_BAR_SCOOP_DEPTH).toBe(FAB_SIZE - FAB_OVERHANG);
  });

  it('fab gap is wider than the cradle opening so icons clear the notch', () => {
    const gap = getTabBarFabGapWidth();
    expect(gap).toBeGreaterThan(FAB_SIZE);
    expect(gap).toBeGreaterThan(DEFAULT_TAB_BAR_SCOOP_RADIUS);
  });
});

describe('buildPawTabBarShellPath', () => {
  const base = {
    width: 360,
    height: 64,
    cornerRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
    scoopRadius: DEFAULT_TAB_BAR_SCOOP_RADIUS,
    scoopDepth: DEFAULT_TAB_BAR_SCOOP_DEPTH,
  };

  it('returns a closed SVG path string with a scooped top', () => {
    const d = buildPawTabBarShellPath(base);
    expect(d.startsWith('M')).toBe(true);
    expect(d.trim().endsWith('Z') || d.trim().endsWith('z')).toBe(true);
    // Soft shoulders (cubics) + circular cradle (arc)
    expect(d).toContain('C');
    expect(d).toContain('A');
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
