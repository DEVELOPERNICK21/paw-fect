# Paw Tab Bar Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sliding circular active highlight to `PawTabBar` with springy native-driver motion, without changing tab destinations, FAB behavior, or the pet picker.

**Architecture:** Extract pure motion helpers (side-tab index + pill translateX) with unit tests. Keep a single shared `Animated.Value` for indicator `translateX` (and opacity/scale) owned by `PawTabBar`. `TabSlot` reports layout centers and drops its local active chip background. Pets selection fades the side pill; FAB remains the active affordance.

**Tech Stack:** React Native `Animated` (`useNativeDriver: true`), existing `@react-navigation/bottom-tabs` custom tab bar, Jest unit tests for pure helpers.

## Global Constraints

- Do **not** add `react-native-reanimated` or gesture-handler for this work.
- Do **not** change navigation routes, `jumpToTabRoot`, FAB tap/long-press pet picker, or labels.
- Prefer transform/opacity only for native-driver animations; fixed pill size + `translateX`.
- Keep `TAB_BAR_VISUAL_HEIGHT` / `useAppTabBarInset` unless visual height truly changes.
- Theme tokens only (`colors.primaryLight`, `colors.accent`, etc.) — no hardcoded brand colors.
- Haptics are **out of this plan** (spec optional; skip to stay YAGNI).

**Spec:** `docs/superpowers/specs/2026-08-10-paw-tab-bar-motion-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/app/navigation/components/pawTabBarMotion.ts` | Pure helpers: side-tab index, pill visibility, translateX from centers |
| Create: `src/app/navigation/components/__tests__/pawTabBarMotion.test.ts` | Unit tests for helpers |
| Modify: `src/app/navigation/components/PawTabBar.tsx` | Sliding pill UI, measure centers, drive animations; strip TabSlot chip bg |
| Touch only if needed: `src/app/navigation/layout.ts` | Height/inset contract — leave unchanged unless pill increases visual height |

---

### Task 1: Pure motion helpers + tests

**Files:**
- Create: `src/app/navigation/components/pawTabBarMotion.ts`
- Create: `src/app/navigation/components/__tests__/pawTabBarMotion.test.ts`

**Interfaces:**
- Consumes: none (pure)
- Produces:
  - `export type SideTabKey = 'home' | 'health' | 'notifications' | 'settings'`
  - `export type TabBarKey = SideTabKey | 'pets'`
  - `export const SIDE_TAB_ORDER: readonly SideTabKey[]`
  - `export function sideTabIndex(key: TabBarKey): number | null`
  - `export function isSideTabActive(key: TabBarKey): boolean`
  - `export function pillTranslateX(centersX: ReadonlyArray<number | undefined>, sideIndex: number, pillSize: number): number | null`

- [ ] **Step 1: Write the failing test**

```typescript
import {
  SIDE_TAB_ORDER,
  isSideTabActive,
  pillTranslateX,
  sideTabIndex,
} from '../pawTabBarMotion';

describe('pawTabBarMotion', () => {
  it('maps side tabs to stable indices and pets to null', () => {
    expect(SIDE_TAB_ORDER).toEqual([
      'home',
      'health',
      'notifications',
      'settings',
    ]);
    expect(sideTabIndex('home')).toBe(0);
    expect(sideTabIndex('health')).toBe(1);
    expect(sideTabIndex('notifications')).toBe(2);
    expect(sideTabIndex('settings')).toBe(3);
    expect(sideTabIndex('pets')).toBeNull();
  });

  it('treats only side tabs as pill-visible actives', () => {
    expect(isSideTabActive('home')).toBe(true);
    expect(isSideTabActive('pets')).toBe(false);
  });

  it('centers the pill on the measured tab X', () => {
    const centers = [40, 120, 280, 360];
    expect(pillTranslateX(centers, 0, 40)).toBe(20); // 40 - 20
    expect(pillTranslateX(centers, 2, 40)).toBe(260); // 280 - 20
  });

  it('returns null when the target center is missing', () => {
    expect(pillTranslateX([40, undefined, 280, 360], 1, 40)).toBeNull();
    expect(pillTranslateX([40], 3, 40)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarMotion.test.ts`

Expected: FAIL (module or exports not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
export type SideTabKey = 'home' | 'health' | 'notifications' | 'settings';
export type TabBarKey = SideTabKey | 'pets';

export const SIDE_TAB_ORDER: readonly SideTabKey[] = [
  'home',
  'health',
  'notifications',
  'settings',
] as const;

export function sideTabIndex(key: TabBarKey): number | null {
  const index = SIDE_TAB_ORDER.indexOf(key as SideTabKey);
  return index >= 0 ? index : null;
}

export function isSideTabActive(key: TabBarKey): boolean {
  return sideTabIndex(key) != null;
}

/**
 * Absolute `left`-equivalent for an indicator using `translateX` from x=0
 * when the pill's left edge should sit at `centerX - pillSize/2`.
 */
export function pillTranslateX(
  centersX: ReadonlyArray<number | undefined>,
  sideIndex: number,
  pillSize: number,
): number | null {
  const centerX = centersX[sideIndex];
  if (centerX == null || !Number.isFinite(centerX)) {
    return null;
  }
  return centerX - pillSize / 2;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarMotion.test.ts`

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/navigation/components/pawTabBarMotion.ts \
  src/app/navigation/components/__tests__/pawTabBarMotion.test.ts
git commit -m "$(cat <<'EOF'
feat(nav): add paw tab bar motion helpers

Pure side-tab index and pill translate helpers so the sliding indicator can be tested without mounting the tab bar.
EOF
)"
```

---

### Task 2: Wire sliding circular indicator into `PawTabBar`

**Files:**
- Modify: `src/app/navigation/components/PawTabBar.tsx`

**Interfaces:**
- Consumes: `sideTabIndex`, `isSideTabActive`, `pillTranslateX`, `SIDE_TAB_ORDER` from `./pawTabBarMotion`
- Produces: Working sliding pill behind the active side tab; Pets hides/fades pill

- [ ] **Step 1: Add constants and indicator state in `PawTabBar`**

Near existing FAB constants, add:

```typescript
const PILL_SIZE = 40;
```

Inside `PawTabBar` (after `currentKey`):

```typescript
const barRowRef = useRef<View>(null);
const centersXRef = useRef<Array<number | undefined>>([
  undefined,
  undefined,
  undefined,
  undefined,
]);
const pillX = useRef(new Animated.Value(0)).current;
const pillOpacity = useRef(new Animated.Value(isSideTabActive(currentKey) ? 1 : 0)).current;
const pillScale = useRef(new Animated.Value(1)).current;
const hasPositionedPill = useRef(false);
```

- [ ] **Step 2: Measure tab centers relative to the bar row**

Add a callback passed into each `TabSlot`:

```typescript
const onTabCenter = useCallback((sideIndex: number, pageX: number, width: number) => {
  barRowRef.current?.measureInWindow((barX) => {
    const centerInBar = pageX + width / 2 - barX;
    centersXRef.current[sideIndex] = centerInBar;
    const activeIndex = sideTabIndex(currentKey);
    if (activeIndex === sideIndex) {
      const x = pillTranslateX(centersXRef.current, activeIndex, PILL_SIZE);
      if (x != null) {
        if (!hasPositionedPill.current) {
          pillX.setValue(x);
          hasPositionedPill.current = true;
        }
      }
    }
  });
}, [currentKey, pillX]);
```

In `TabSlot`, wrap the pressable content in a `View` with:

```typescript
onLayout={(e) => {
  // Prefer measureInWindow for stable page coords
  e.currentTarget.measureInWindow?.((x, _y, width) => {
    onCenterMeasured?.(x, width);
  });
}}
```

Expose `onCenterMeasured?: (pageX: number, width: number) => void` and `sideIndex` on `TabSlotProps`. Parent binds:

```typescript
onCenterMeasured={(pageX, width) => onTabCenter(0, pageX, width)}
```

(for home=0, health=1, notifications=2, settings=3).

**Note:** If `measureInWindow` typing on the event target is awkward in this RN version, use a `ref` on the TabSlot root `View` and call `ref.measureInWindow` from `onLayout`.

- [ ] **Step 3: Animate pill when `currentKey` changes**

```typescript
useEffect(() => {
  const index = sideTabIndex(currentKey);
  const show = index != null;
  Animated.timing(pillOpacity, {
    toValue: show ? 1 : 0,
    duration: 180,
    useNativeDriver: true,
  }).start();

  if (index == null) {
    return;
  }
  const x = pillTranslateX(centersXRef.current, index, PILL_SIZE);
  if (x == null) {
    return;
  }
  if (!hasPositionedPill.current) {
    pillX.setValue(x);
    hasPositionedPill.current = true;
    return;
  }
  Animated.parallel([
    Animated.spring(pillX, {
      toValue: x,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(pillScale, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(pillScale, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}, [currentKey, pillOpacity, pillScale, pillX]);
```

Also re-run positioning when `winW` changes: reset `hasPositionedPill` only after remasure, or snap:

```typescript
useEffect(() => {
  hasPositionedPill.current = false;
  centersXRef.current = [undefined, undefined, undefined, undefined];
}, [winW]);
```

- [ ] **Step 4: Render the pill inside the bar row**

Attach `ref={barRowRef}` to the `barRow` `View` and set `overflow: 'visible'`. Render as the first child of `barRow` (absolute):

```tsx
<Animated.View
  pointerEvents="none"
  style={{
    position: 'absolute',
    top: 8, // optically center on icons; tweak to match labels layout
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: PILL_SIZE / 2,
    backgroundColor: colors.primaryLight,
    opacity: pillOpacity,
    transform: [{ translateX: pillX }, { scale: pillScale }],
  }}
/>
```

- [ ] **Step 5: Remove local active chip background from `TabSlot`**

In `TabSlot`, change the chip style so it no longer sets:

```typescript
backgroundColor: active ? colors.primaryLight : 'transparent',
```

Use transparent always. Keep icon color crossfade + label accent/subdued. Keep press scale.

Ensure `tabChip` still has enough hit area; icons remain visually centered over the shared pill.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`

Expected: no new errors in navigation components

- [ ] **Step 7: Commit**

```bash
git add src/app/navigation/components/PawTabBar.tsx
git commit -m "$(cat <<'EOF'
feat(nav): slide circular active pill on paw tab bar

Drive a shared native-driver indicator between measured side tabs; fade it when the pets FAB is active.
EOF
)"
```

---

### Task 3: Manual polish + verification

**Files:**
- Modify: `src/app/navigation/components/PawTabBar.tsx` (optical tweaks only: `top`, `PILL_SIZE`, spring friction if needed)

**Interfaces:**
- Consumes: Task 2 behavior
- Produces: Spec success criteria met on device/simulator

- [ ] **Step 1: Manual checklist on iOS or Android**

1. Switch Home → Health → Wellness → Settings: pill springs between icons; no jump to 0.
2. Tap Pets FAB: side pill fades out; FAB border/lift still shows active.
3. From Pets, tap Home: pill fades/springs onto Home.
4. Long-press FAB: orbit pet picker still opens; dismiss still works.
5. Re-tap focused side tab: still jumps to tab root (unchanged).
6. Light and dark theme: pill readable on `tabBarBackground`; active icon accent still clear.
7. Scroll a screen with `useAppTabBarInset`: content still clears the bar (height unchanged).

- [ ] **Step 2: Fix optical issues if needed**

If the pill sits too high/low relative to icons, adjust only the absolute `top` (and optionally `PILL_SIZE` 36–44). Do not change `TAB_BAR_VISUAL_HEIGHT` unless the bar visually grows.

If rapid taps feel laggy, ensure each `currentKey` effect starts a new spring to the latest target (latest wins — already true if effect re-runs).

- [ ] **Step 3: Re-run unit tests**

Run: `yarn test -- src/app/navigation/components/__tests__/pawTabBarMotion.test.ts`

Expected: PASS

- [ ] **Step 4: Commit polish if any code changed**

```bash
git add src/app/navigation/components/PawTabBar.tsx
git commit -m "$(cat <<'EOF'
polish(nav): tune paw tab sliding pill optics

EOF
)"
```

If no code changed after checklist, skip commit.

---

## Spec coverage self-check

| Spec requirement | Task |
| --- | --- |
| Sliding circular pill on side tabs | Task 2 |
| Keep FAB + long-press picker | Task 2 (no behavior edits) / Task 3 verify |
| Fade pill when Pets active | Task 2 Step 3 |
| RN Animated only, native driver | Tasks 1–2 |
| Measure centers; single shared values | Task 2 |
| Remove static chip bg | Task 2 Step 5 |
| Keep labels | Task 2 (unchanged label JSX) |
| Width/rotation remeasure | Task 2 `winW` reset |
| Manual test matrix | Task 3 |
| No Reanimated / no shell redesign | Global constraints |
| Haptics | Explicitly out |

## Placeholder scan

No TBD/TODO placeholders. Helper and wiring code included. Haptics deferred by constraint, not left vague.
