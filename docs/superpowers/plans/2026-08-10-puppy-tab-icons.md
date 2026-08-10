# Puppy Metaphor Tab Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic side-tab Material icons with soft pet metaphors (house+paw, bone+cross, heart+paw, collar/gear) using outline/filled pairs.

**Architecture:** Add eight new monochrome SVG path names to `MaterialIcon`. Remap `PawTabBar` `TabSlot` icons + `TAB_OUTLINE` to those names. Keep existing outline→filled crossfade, press spring, activate bounce, and accent pill colors.

**Tech Stack:** React Native, `react-native-svg`, existing `MaterialIcon` + `PawTabBar` `Animated` interaction.

## Global Constraints

- Theme tokens only for icon colors (`colors.text.inverse` active, `colors.text.subdued` inactive).
- Monochrome paths tintable via `color`; viewBox `0 0 24 24`; default size 24.
- Add new icon names; do not break existing `home` / `settings` / `medical_services` / `analytics` consumers.
- No Reanimated; no new icon packages; center paw FAB unchanged.
- Commit only when the user explicitly asks (user rule overrides frequent-commit defaults).

---

## File map

| File | Responsibility |
| --- | --- |
| `src/shared/components/MaterialIcon.tsx` | Register 8 new path glyphs |
| `src/app/navigation/components/PawTabBar.tsx` | Map tabs to new filled/outline names |
| `src/shared/components/__tests__/MaterialIcon.paths.test.ts` | Assert new icon names exist in PATHS (export a name list for testing) |

---

### Task 1: Export icon name coverage + failing test

**Files:**
- Modify: `src/shared/components/MaterialIcon.tsx`
- Create: `src/shared/components/__tests__/MaterialIcon.paths.test.ts`

**Interfaces:**
- Consumes: existing `IconName` / `PATHS`
- Produces: `export const MATERIAL_ICON_NAMES: readonly IconName[]` (or `export function hasMaterialIcon(name: string): boolean`) so tests can assert without rendering SVG

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/__tests__/MaterialIcon.paths.test.ts`:

```typescript
import { MATERIAL_ICON_NAMES } from '../MaterialIcon';

const PUPPY_TAB_ICONS = [
  'home_paw',
  'home_paw_outline',
  'bone_cross',
  'bone_cross_outline',
  'heart_paw',
  'heart_paw_outline',
  'collar_settings',
  'collar_settings_outline',
] as const;

describe('MaterialIcon puppy tab paths', () => {
  it.each(PUPPY_TAB_ICONS)('registers %s', name => {
    expect(MATERIAL_ICON_NAMES).toContain(name);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/shared/components/__tests__/MaterialIcon.paths.test.ts --watchman=false`

Expected: FAIL (module has no `MATERIAL_ICON_NAMES` and/or names missing)

- [ ] **Step 3: Export name list + add IconName union members (paths can be temporary stubs)**

In `MaterialIcon.tsx`:

1. Extend `IconName` with the eight names above.
2. Add stub paths (copy `home` / `home_outline` temporarily is fine) so `PATHS` typechecks.
3. Export:

```typescript
export const MATERIAL_ICON_NAMES = Object.keys(PATHS) as IconName[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test -- src/shared/components/__tests__/MaterialIcon.paths.test.ts --watchman=false`

Expected: PASS

- [ ] **Step 5: Commit only if user asks**

Do not commit unless explicitly requested.

---

### Task 2: Real puppy metaphor path artwork

**Files:**
- Modify: `src/shared/components/MaterialIcon.tsx` (`PATHS` entries for the eight names)

**Interfaces:**
- Consumes: `IconName` members from Task 1
- Produces: Final `PATHS` strings (viewBox 0 0 24 24) listed below

- [ ] **Step 1: Replace stub paths with these glyphs**

Use exactly these path strings (tuned for 24px monochrome silhouettes; door notch / protruding cross avoid cutout tricks):

```typescript
  home_paw:
    // Filled house (door notch) + paw pads in the doorway
    'M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 11.2c.42 0 .75.33.75.75s-.33.75-.75.75-.75-.33-.75-.75.33-.75.75-.75zm-1.7 1.55c.36 0 .65.29.65.65s-.29.65-.65.65-.65-.29-.65-.65.29-.65.65-.65zm3.4 0c.36 0 .65.29.65.65s-.29.65-.65.65-.65-.29-.65-.65.29-.65.65-.65zm-1.7.95c.9 0 1.55.4 1.55.95 0 .35-.65.6-1.55.6s-1.55-.25-1.55-.6c0-.55.65-.95 1.55-.95z',
  home_paw_outline:
    'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 11.2c.42 0 .75.33.75.75s-.33.75-.75.75-.75-.33-.75-.75.33-.75.75-.75zm-1.7 1.55c.36 0 .65.29.65.65s-.29.65-.65.65-.65-.29-.65-.65.29-.65.65-.65zm3.4 0c.36 0 .65.29.65.65s-.29.65-.65.65-.65-.29-.65-.65.29-.65.65-.65zm-1.7.95c.9 0 1.55.4 1.55.95 0 .35-.65.6-1.55.6s-1.55-.25-1.55-.6c0-.55.65-.95 1.55-.95z',
  bone_cross:
    // Horizontal bone + medical cross protruding past the shaft
    'M7.2 9.2a2.8 2.8 0 0 0 0 5.6h1.1v1.1c0 .6.5 1.1 1.1 1.1h5.2c.6 0 1.1-.5 1.1-1.1v-1.1h1.1a2.8 2.8 0 0 0 0-5.6h-1.1V8.1c0-.6-.5-1.1-1.1-1.1H9.4c-.6 0-1.1.5-1.1 1.1v1.1H7.2zm4.05-2.7h1.5v2.2h2.2v1.5h-2.2v2.2h-1.5v-2.2H9.05v-1.5h2.2V6.5z',
  bone_cross_outline:
    'M7.2 10.2a1.8 1.8 0 0 0 0 3.6h1.6v1.6c0 .33.27.6.6.6h5.2c.33 0 .6-.27.6-.6v-1.6h1.6a1.8 1.8 0 0 0 0-3.6h-1.6V8.6c0-.33-.27-.6-.6-.6H9.4c-.33 0-.6.27-.6.6v1.6H7.2zm1.8-.2h1.2V8.6h5.2v1.4h1.2a.8.8 0 0 1 0 1.6h-1.2v1.4H10.2v-1.4H9a.8.8 0 0 1 0-1.6zm2.25-3.5h1.5v1.7h1.7v1.5h-1.7v1.7h-1.5v-1.7H9.05v-1.5h1.7V6.5z',
  heart_paw:
    // Heart body + paw pads clustered at the tip
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM12 11.1c.4 0 .72.32.72.72s-.32.72-.72.72-.72-.32-.72-.72.32-.72.72-.72zm-1.55 1.4c.34 0 .62.28.62.62s-.28.62-.62.62-.62-.28-.62-.62.28-.62.62-.62zm3.1 0c.34 0 .62.28.62.62s-.28.62-.62.62-.62-.28-.62-.62.28-.62.62-.62zm-1.55.85c.78 0 1.35.35 1.35.85 0 .3-.57.52-1.35.52s-1.35-.22-1.35-.52c0-.5.57-.85 1.35-.85z',
  heart_paw_outline:
    'M16.5 3c-1.74 0-3.41.81-4.55 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C20.6 15.36 24 12.28 24 8.5 24 5.42 21.58 3 18.5 3h-2zM12 19.35l-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.75l-.1.1zM12 11.1c.4 0 .72.32.72.72s-.32.72-.72.72-.72-.32-.72-.72.32-.72.72-.72zm-1.55 1.4c.34 0 .62.28.62.62s-.28.62-.62.62-.62-.28-.62-.62.28-.62.62-.62zm3.1 0c.34 0 .62.28.62.62s-.28.62-.62.62-.62-.28-.62-.62.28-.62.62-.62zm-1.55.85c.78 0 1.35.35 1.35.85 0 .3-.57.52-1.35.52s-1.35-.22-1.35-.52c0-.5.57-.85 1.35-.85z',
  collar_settings:
    // Rounded collar-tag gear: outer toothed disc + inner hole ring suggestion via center disc
    'M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94L14.4 2.8a.5.5 0 0 0-.49-.4h-3.84a.5.5 0 0 0-.49.4l-.36 2.52c-.58.22-1.12.53-1.63.94L5.2 5.3a.5.5 0 0 0-.6.22L2.68 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.8 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.41 1.05.73 1.63.94l.36 2.52c.04.24.25.4.49.4h3.84c.24 0 .45-.16.49-.4l.36-2.52c.58-.22 1.12-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5zM12 10.2a1.8 1.8 0 1 0 .001 3.601A1.8 1.8 0 0 0 12 10.2z',
  collar_settings_outline:
    'M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94L14.4 2.8a.5.5 0 0 0-.49-.4h-3.84a.5.5 0 0 0-.49.4l-.36 2.52c-.58.22-1.12.53-1.63.94L5.2 5.3a.5.5 0 0 0-.6.22L2.68 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.8 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.41 1.05.73 1.63.94l.36 2.52c.04.24.25.4.49.4h3.84c.24 0 .45-.16.49-.4l.36-2.52c.58-.22 1.12-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5zM12 9.5a2.5 2.5 0 1 0 .001 5.001A2.5 2.5 0 0 0 12 9.5z',
```

Notes for implementer:
- If any filled icon’s paw pads disappear into a solid fill at runtime, move the pads into the house door notch / below the heart tip (already intended for `home_paw`).
- `collar_settings` keeps a gear silhouette (readable as Settings) with an inner ring to read as a collar tag.

- [ ] **Step 2: Re-run path registration test**

Run: `yarn test -- src/shared/components/__tests__/MaterialIcon.paths.test.ts --watchman=false`

Expected: PASS

- [ ] **Step 3: Commit only if user asks**

---

### Task 3: Wire PawTabBar to puppy icons

**Files:**
- Modify: `src/app/navigation/components/PawTabBar.tsx` (TabIconName / TabOutlineIconName / TAB_OUTLINE / TabSlot call sites)

**Interfaces:**
- Consumes: MaterialIcon names from Task 2
- Produces: Tab mapping:

| Tab | `icon` prop |
| --- | --- |
| Home | `home_paw` |
| Health | `bone_cross` |
| Wellness | `heart_paw` |
| Settings | `collar_settings` |

- [ ] **Step 1: Update type aliases and TAB_OUTLINE**

Replace the current tab icon types/map with:

```typescript
type TabIconName =
  | 'home_paw'
  | 'bone_cross'
  | 'heart_paw'
  | 'collar_settings';

type TabOutlineIconName =
  | 'home_paw_outline'
  | 'bone_cross_outline'
  | 'heart_paw_outline'
  | 'collar_settings_outline';

const TAB_OUTLINE: Record<TabIconName, TabOutlineIconName> = {
  home_paw: 'home_paw_outline',
  bone_cross: 'bone_cross_outline',
  heart_paw: 'heart_paw_outline',
  collar_settings: 'collar_settings_outline',
};
```

- [ ] **Step 2: Update TabSlot call sites**

```typescript
<TabSlot ... icon="home_paw" ... />
<TabSlot ... icon="bone_cross" ... />
<TabSlot ... icon="heart_paw" ... />
<TabSlot ... icon="collar_settings" ... />
```

Keep accessibility labels unchanged: Home / Health records / Wellness / Settings.

- [ ] **Step 3: Typecheck + motion tests**

Run:

```bash
npx tsc --noEmit
yarn test -- src/app/navigation/components/__tests__/pawTabBarMotion.test.ts src/shared/components/__tests__/MaterialIcon.paths.test.ts --watchman=false
```

Expected: no errors related to PawTabBar/MaterialIcon; both test files PASS.

- [ ] **Step 4: Manual visual check**

Reload the app and confirm:
1. Side tabs show pet metaphors (not generic home/kit/chart/gear).
2. Inactive = outline; active = filled on accent pill.
3. Press + bounce still work.
4. Center paw FAB unchanged.

- [ ] **Step 5: Commit only if user asks**

---

## Spec coverage self-review

| Spec requirement | Task |
| --- | --- |
| Soft pet metaphors mapping | Task 2 + 3 |
| Outline/filled pairs in MaterialIcon | Task 1 + 2 |
| Wire PawTabBar TabSlot | Task 3 |
| Keep a11y labels | Task 3 Step 2 |
| Keep interaction / FAB / no Reanimated | Task 3 (no motion changes) |
| Typecheck / motion tests | Task 3 Step 3 |
| Don’t break existing icon consumers | Task 1 (new names only) |

Placeholder scan: none. Name consistency: `home_paw` / `bone_cross` / `heart_paw` / `collar_settings` + `_outline` used throughout.
