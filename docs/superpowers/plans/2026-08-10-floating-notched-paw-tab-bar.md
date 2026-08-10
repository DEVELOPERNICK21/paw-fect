# Floating Notched Paw Tab Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `PawTabBar` into a floating SVG scoop island with brand colors and icon-only side tabs, keeping FAB + pet-picker behavior and the sliding circular pill.

**Architecture:** Pure `buildPawTabBarShellPath` generates an SVG path from bar size + scoop params. `PawTabBar` wraps that path in a floating, shadowed container; side tabs stay icon-only with existing motion helpers; `layout.ts` inset grows for float gap + FAB overhang.

**Tech Stack:** React Native, `react-native-svg`, existing RN `Animated`, Jest for pure helpers.

## Global Constraints

- Geometry via `react-native-svg` filled path — **not** Skia, **not** stacked fake cutouts.
- Keep Pawsoul tokens (`colors.tabBarBackground` / surface, `colors.accent`, `colors.primaryLight`) — no lime reference palette.
- Side tabs **icon-only** (remove visible labels; keep `accessibilityLabel`).
- Keep sliding circular pill + native-driver springs; no Reanimated.
- Do **not** change routes, `jumpToTabRoot`, FAB tap, or long-press pet picker.
- Update `TAB_BAR_VISUAL_HEIGHT` / `useAppTabBarInset` so scroll content clears the floating bar.
- Rebuild SVG path only on width / geometry param change — not every frame.

**Spec:** `docs/superpowers/specs/2026-08-10-floating-notched-paw-tab-bar-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/app/navigation/components/pawTabBarShellPath.ts` | Pure SVG path + geometry constants |
| Create: `src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts` | Unit tests for path helper |
| Modify: `src/app/navigation/layout.ts` | Raise visual height / inset for float + FAB overhang |
| Modify: `src/app/navigation/components/PawTabBar.tsx` | Floating SVG shell, icon-only tabs, FAB in scoop |
| Reuse: `src/app/navigation/components/pawTabBarMotion.ts` | Existing pill math (no change unless needed) |

---

### Task 1: Shell path helper + tests

**Files:**
- Create: `src/app/navigation/components/pawTabBarShellPath.ts`
- Create: `src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type PawTabBarShellParams = { width: number; height: number; cornerRadius: number; scoopRadius: number; scoopDepth: number }`
  - `export function buildPawTabBarShellPath(params: PawTabBarShellParams): string`
  - `export const DEFAULT_TAB_BAR_CORNER_RADIUS = 28`
  - `export const DEFAULT_TAB_BAR_SCOOP_RADIUS = 38`
  - `export const DEFAULT_TAB_BAR_SCOOP_DEPTH = 26`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts --watchman=false`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
export type PawTabBarShellParams = {
  width: number;
  height: number;
  cornerRadius: number;
  scoopRadius: number;
  scoopDepth: number;
};

export const DEFAULT_TAB_BAR_CORNER_RADIUS = 28;
export const DEFAULT_TAB_BAR_SCOOP_RADIUS = 38;
export const DEFAULT_TAB_BAR_SCOOP_DEPTH = 26;

/**
 * Closed SVG path for a floating tab bar with rounded ends and a center scoop.
 * Coordinate origin: top-left of the bar rect (0,0). Scoop dips downward (+y).
 */
export function buildPawTabBarShellPath(params: PawTabBarShellParams): string {
  const width = Math.max(params.width, 1);
  const height = Math.max(params.height, 1);
  const r = Math.min(
    Math.max(params.cornerRadius, 0),
    height / 2,
    width / 4,
  );
  const maxScoopR = Math.max(8, width / 2 - r - 8);
  const scoopR = Math.min(Math.max(params.scoopRadius, 8), maxScoopR);
  const scoopDepth = Math.min(
    Math.max(params.scoopDepth, 0),
    height - 8,
    scoopR,
  );

  const cx = width / 2;
  const scoopHalf = scoopR;
  const leftScoop = cx - scoopHalf;
  const rightScoop = cx + scoopHalf;

  // Top edge with center scoop (cubic bezier dip).
  // Start mid-left on top after left corner arc conceptually via M at top-left + r.
  const d = [
    `M ${r} 0`,
    `L ${leftScoop} 0`,
    // Scoop: down into cradle and back up
    `C ${leftScoop + scoopHalf * 0.35} 0 ${cx - scoopHalf * 0.55} ${scoopDepth} ${cx} ${scoopDepth}`,
    `C ${cx + scoopHalf * 0.55} ${scoopDepth} ${rightScoop - scoopHalf * 0.35} 0 ${rightScoop} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');

  return d;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts --watchman=false`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation/components/pawTabBarShellPath.ts \
  src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts
git commit -m "$(cat <<'EOF'
feat(nav): add floating tab bar SVG scoop path helper

Pure parameterized path for the notched shell so geometry can be tested without mounting the tab bar.
EOF
)"
```

---

### Task 2: Update inset contract in `layout.ts`

**Files:**
- Modify: `src/app/navigation/layout.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `TAB_BAR_VISUAL_HEIGHT = 110` (bar ~64 + FAB overhang above scoop ~30 + float gap ~8 — tune if Task 3 needs ±4)
  - `TAB_BAR_FLOAT_GAP = 8` exported for `PawTabBar` bottom margin
  - `TAB_BAR_HORIZONTAL_INSET = 16` exported for side margin
  - `useAppTabBarInset()` still returns `TAB_BAR_VISUAL_HEIGHT + bottomPad`

- [ ] **Step 1: Replace `layout.ts` contents with**

```typescript
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Horizontal inset of the floating island from screen edges. */
export const TAB_BAR_HORIZONTAL_INSET = 16;

/** Gap between safe-area bottom and the floating island. */
export const TAB_BAR_FLOAT_GAP = 8;

/**
 * Visual chrome height above the safe-area pad: floating bar + FAB overhang + float gap.
 * Must stay in sync with `PawTabBar` geometry.
 */
export const TAB_BAR_VISUAL_HEIGHT = 110;

/**
 * Bottom inset below scroll content: matches floating `PawTabBar`
 * (`TAB_BAR_VISUAL_HEIGHT` + safe bottom).
 */
export function useAppTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  const bottomPad = Math.max(bottom, Platform.OS === 'ios' ? 6 : 4);
  return TAB_BAR_VISUAL_HEIGHT + bottomPad;
}
```

- [ ] **Step 2: Confirm no TypeScript breakages for exports used elsewhere**

Run: `npx tsc --noEmit`  
Expected: no new errors from renamed/removed exports (`TAB_BAR_VISUAL_HEIGHT` and `useAppTabBarInset` remain)

- [ ] **Step 3: Commit**

```bash
git add src/app/navigation/layout.ts
git commit -m "$(cat <<'EOF'
feat(nav): raise tab bar inset for floating notched shell

Export float gap and horizontal inset constants and bump visual height so scroll content clears the island.
EOF
)"
```

---

### Task 3: Wire floating SVG shell + icon-only tabs in `PawTabBar`

**Files:**
- Modify: `src/app/navigation/components/PawTabBar.tsx`

**Interfaces:**
- Consumes:
  - `buildPawTabBarShellPath`, `DEFAULT_TAB_BAR_*` from `./pawTabBarShellPath`
  - `TAB_BAR_VISUAL_HEIGHT`, `TAB_BAR_FLOAT_GAP`, `TAB_BAR_HORIZONTAL_INSET` from `../layout`
  - Existing `pawTabBarMotion` helpers
- Produces: Floating notched bar UI; same navigation behavior

- [ ] **Step 1: Add SVG imports and bar geometry constants**

```typescript
import Svg, { Path } from 'react-native-svg';
import {
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_HORIZONTAL_INSET,
  TAB_BAR_VISUAL_HEIGHT,
} from '../layout';
import {
  DEFAULT_TAB_BAR_CORNER_RADIUS,
  DEFAULT_TAB_BAR_SCOOP_DEPTH,
  DEFAULT_TAB_BAR_SCOOP_RADIUS,
  buildPawTabBarShellPath,
} from './pawTabBarShellPath';

const BAR_HEIGHT = 64;
// FAB sits elevated into scoop; keep FAB_SIZE = 58
const FAB_OVERHANG = 30; // how much FAB center sits above bar top visually
```

Remove dependency on full-bleed `borderTopWidth` shell background.

- [ ] **Step 2: Make `TabSlot` icon-only**

- Remove visible `<Text>` label rendering from `TabSlot`.
- Keep `accessibilityLabel` prop (required for a11y).
- Optionally drop unused `label` from UI (can keep prop for now unused, or remove from call sites — prefer remove `label`/`compactLabel`/`fontFamilies` from `TabSlot` if unused after icon-only).
- Tighten chip padding for icon-only (`paddingVertical: 10`, no label gap).
- Do **not** wrap `Pressable` in a View that clips `hitSlop`.

- [ ] **Step 3: Replace outer shell layout**

Structure:

```tsx
<View
  pointerEvents="box-none"
  style={[
    styles.shell,
    {
      height: TAB_BAR_VISUAL_HEIGHT + bottomPad,
      paddingBottom: bottomPad + TAB_BAR_FLOAT_GAP,
      paddingHorizontal: TAB_BAR_HORIZONTAL_INSET,
      backgroundColor: 'transparent',
    },
  ]}
>
  <View style={[styles.islandWrap, shadows.lg]}>
    <Svg
      width={islandWidth}
      height={BAR_HEIGHT}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path d={shellPath} fill={colors.tabBarBackground} />
    </Svg>

    <View ref={barRowRef} style={[styles.barRow, { height: BAR_HEIGHT }]}>
      {/* sliding pill + sides + fabGap — same as today */}
    </View>

    {/* FAB layer absolute, centered, bottom aligned into scoop */}
  </View>
</View>
```

Where:

```typescript
const islandWidth = Math.max(winW - TAB_BAR_HORIZONTAL_INSET * 2, 1);
const shellPath = useMemo(
  () =>
    buildPawTabBarShellPath({
      width: islandWidth,
      height: BAR_HEIGHT,
      cornerRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
      scoopRadius: DEFAULT_TAB_BAR_SCOOP_RADIUS,
      scoopDepth: DEFAULT_TAB_BAR_SCOOP_DEPTH,
    }),
  [islandWidth],
);
```

- [ ] **Step 4: Position FAB in the scoop**

- Center horizontally in `islandWrap`.
- Vertically: FAB bottom/center should sit in the scoop dip (`scoopDepth`), with the top half of the FAB above the bar top (reference pose).
- Adjust `FAB_BOTTOM` / absolute `bottom` so the circle cradles in the notch without covering side icons.
- Keep press / long-press / Pets-active border / lift animations.

- [ ] **Step 5: Update styles**

Replace full-bleed shell styles roughly with:

```typescript
shell: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'visible',
},
islandWrap: {
  borderRadius: DEFAULT_TAB_BAR_CORNER_RADIUS,
  overflow: 'visible',
  backgroundColor: 'transparent',
},
barRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 8,
  overflow: 'visible',
},
fabGap: {
  width: DEFAULT_TAB_BAR_SCOOP_RADIUS * 2,
},
```

Remove hairline `borderTopWidth` and full-width opaque background from the outer shell.

- [ ] **Step 6: Keep pill measurement relative to `barRowRef`**

- Continues to use `measureInWindow` on each `Pressable` and `barRowRef`.
- After layout change to floating inset, verify centers still make sense (pill `left: 0` on bar row remains).

- [ ] **Step 7: Typecheck + unit tests**

Run:

```bash
yarn test -- src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts src/app/navigation/components/__tests__/pawTabBarMotion.test.ts --watchman=false
npx tsc --noEmit
```

Expected: shell + motion tests PASS; no new TS errors in navigation files.

- [ ] **Step 8: Commit**

```bash
git add src/app/navigation/components/PawTabBar.tsx
git commit -m "$(cat <<'EOF'
feat(nav): float notched SVG paw tab bar

Render a scooped island shell with brand fill, icon-only side tabs, and FAB cradled in the notch while preserving pill motion and pet picker.
EOF
)"
```

---

### Task 4: Manual polish + inset verification

**Files:**
- Modify as needed: `PawTabBar.tsx`, `layout.ts`, `pawTabBarShellPath.ts` (constants only)

**Interfaces:**
- Consumes: Task 1–3
- Produces: Spec success criteria on device

- [ ] **Step 1: Device / simulator checklist**

1. Island floats with side + bottom gaps; content visible around it.
2. Scoop cradles FAB; paw not clipped; icons not colliding with scoop.
3. Pill slides between side tabs; fades on Pets; snaps when leaving Pets.
4. Long-press FAB opens orbit picker; dismiss works.
5. Light + dark: bar fill + icons + pill readable.
6. Scroll screens using `useAppTabBarInset` — last content not hidden under FAB/bar.
7. If content is clipped or too much empty space, adjust `TAB_BAR_VISUAL_HEIGHT` (±4–12) and/or `FAB` vertical offset only.

- [ ] **Step 2: Optical tuning if needed**

Allowed knobs only:
- `DEFAULT_TAB_BAR_SCOOP_RADIUS` / `SCOOP_DEPTH` / `CORNER_RADIUS`
- `BAR_HEIGHT`, `TAB_BAR_FLOAT_GAP`, `TAB_BAR_HORIZONTAL_INSET`
- `TAB_BAR_VISUAL_HEIGHT`
- Pill `top` / `PILL_SIZE`

- [ ] **Step 3: Re-run unit tests**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarShellPath.test.ts src/app/navigation/components/__tests__/pawTabBarMotion.test.ts --watchman=false`

Expected: PASS

- [ ] **Step 4: Commit polish if code changed**

```bash
git add src/app/navigation/components/PawTabBar.tsx \
  src/app/navigation/layout.ts \
  src/app/navigation/components/pawTabBarShellPath.ts
git commit -m "$(cat <<'EOF'
polish(nav): tune floating notched tab bar geometry

EOF
)"
```

If no code changed, skip commit.

---

## Spec coverage self-check

| Spec requirement | Task |
| --- | --- |
| Floating island + margins | Task 3 |
| Real SVG scoop | Tasks 1 + 3 |
| Brand tokens | Task 3 |
| Icon-only side tabs | Task 3 Step 2 |
| Keep sliding pill | Task 3 |
| FAB in scoop + same behavior | Task 3 Step 4 |
| Shadow/elevation | Task 3 |
| Inset contract update | Tasks 2 + 4 |
| Path rebuild on width only | Task 3 `useMemo` |
| Unit path tests | Task 1 |
| Manual matrix | Task 4 |
| No Reanimated / no lime palette | Global constraints |

## Placeholder scan

No TBD placeholders. Path math, layout constants, and wiring steps include concrete code.
