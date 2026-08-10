# Floating Notched Paw Tab Bar Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Approach:** Floating SVG scoop shell + Pawsoul brand colors + icon-only side tabs with existing sliding circular pill (Approach A shell, Approach A colors, Approach C tabs)

## Goal

Restyle `PawTabBar` into a floating island with a real center scoop cradling the paw FAB, matching the reference silhouette, without changing tab destinations, FAB behavior, or the long-press pet picker.

## Decisions

| Topic | Choice |
| --- | --- |
| Shell | Floating island with horizontal margin, bottom float gap, highly rounded corners, **real center scoop/notch** |
| Geometry | `react-native-svg` filled path (not Skia, not stacked fake cutouts) |
| Colors | Keep Pawsoul tokens (`tabBarBackground` / surface, `accent`, `primaryLight`) — no lime reference palette |
| Side tabs | **Icon-only** (remove visible labels; keep accessibility labels) |
| Active affordance | Keep **sliding circular pill** + native-driver springs from prior motion work |
| FAB | Same paw FAB in scoop: tap → Pets; long-press → orbit picker |
| Animation stack | Existing RN `Animated` only — no Reanimated |
| Insets | Update `TAB_BAR_VISUAL_HEIGHT` / `useAppTabBarInset` to include float gap so scroll content still clears the bar |

## Current baseline

- Edge-to-edge `PawTabBar` shell with full-width background and hairline top border
- Center paw FAB with press scale, Pets-active lift/border, long-press pet orbit Modal
- Side tabs with sliding circular pill (`pillTranslateX` helpers + measure-in-window centers)
- Labels currently visible under icons
- Inset helper: `TAB_BAR_VISUAL_HEIGHT = 92` + safe-area bottom pad

## Scope

### In

1. Replace full-bleed shell with a floating SVG path bar (rounded ends + center concave scoop).
2. Position FAB in the scoop (partially above bar top), keep existing FAB interactions.
3. Remove visible side-tab labels; keep `accessibilityLabel` / selected state.
4. Preserve sliding pill indicator for side tabs; fade when Pets is active.
5. Soft elevation/shadow on a wrapper around the SVG (platform shadow / existing `shadows`).
6. Recalibrate `TAB_BAR_VISUAL_HEIGHT` and `useAppTabBarInset` for float margin + scoop/FAB lift.
7. Theme fill from tokens so light/dark both remain readable.

### Out

1. Lime / charcoal reference color system.
2. Underline-only active indicator (replace pill).
3. Skia-based shell or Reanimated.
4. Changing routes, `jumpToTabRoot`, or pet-picker flow.
5. Redesigning other screens’ chrome beyond inset constant sync.

## Interaction design

### Floating shell

- Horizontal inset from screen edges (token spacing, e.g. `spacing.lg` / ~16–20).
- Bottom float above home indicator / safe area (small gap above safe bottom).
- Outer corner radius large (pill-like ends).
- Center scoop depth sized to cradle `FAB_SIZE` (~58) with comfortable clearance; path parameterized by bar width so rotation/width changes stay correct.

### Side tabs

- Two icons left of scoop, two right (Home, Health | Wellness, Settings).
- Icon-only; hit targets remain large (`hitSlop` on Pressable, no wrapping View that clips slop).
- Sliding circular pill behind active side icon; spring between measured centers; snap when revealing from Pets.

### Center FAB

- Accent circle with paw icon; sits in scoop notch.
- Unchanged: navigate to Pets root; long-press opens orbit picker.
- Keep press scale and Pets-active micro-interaction.

## Performance constraints

- Single SVG background path; avoid per-frame path rebuilds — rebuild on width / theme color change only.
- Keep one shared pill `translateX` / opacity / scale with `useNativeDriver: true`.
- Do not animate layout width of the shell every frame.
- Prefer measuring tab centers as today; remeasure on width / meaningful layout drift.

## Architecture touchpoints

| Unit | Responsibility |
| --- | --- |
| `PawTabBar.tsx` | Compose floating shell, icons, pill, FAB, pet picker |
| New helper (optional) e.g. `pawTabBarShellPath.ts` | Pure function: `(width, height, fabRadius, …) => SVG path string` — unit-testable |
| `pawTabBarMotion.ts` | Existing pill math (reuse) |
| `layout.ts` | Updated visual height + inset including float gap |

No store / use-case / cross-feature changes.

## Error / edge cases

- Narrow widths: path and icon spacing must not collide with scoop; clamp scoop width / side padding.
- Theme switch: SVG fill updates with token color.
- Font scale: icon-only reduces label overflow risk; hit targets still adequate.
- Keyboard hide (`tabBarHideOnKeyboard`) unchanged.
- Safe area: float gap + inset helper must keep content clear of FAB + bar.

## Testing

1. Manual: floating island visible with margin; content scrolls under/around it correctly.
2. Manual: scoop cradles FAB without clipping paw or looking like a flat bar.
3. Manual: side-tab pill slides; Pets fades pill; FAB still active treatment.
4. Manual: long-press pet picker still works.
5. Manual: light + dark themes readable.
6. Unit: shell path helper produces finite path for representative widths; motion helpers still pass.

## Success criteria

- Reads as a floating notched bar similar to the reference silhouette.
- Brand colors preserved.
- Same navigation functionality as today.
- Insets remain correct for all screens using `useAppTabBarInset`.
- No new animation libraries.
