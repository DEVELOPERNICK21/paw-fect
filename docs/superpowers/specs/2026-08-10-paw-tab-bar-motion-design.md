# Paw Tab Bar Motion Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Approach:** Keep current edge-to-edge bar + center paw FAB; add sliding circular active highlight and smoother native-driver motion (Approaches A + C)

## Goal

Make `PawTabBar` feel more interactive and smoother without changing navigation behavior, tab destinations, or the pet FAB / long-press pet picker.

## Decisions

| Topic | Choice |
| --- | --- |
| Layout | Keep current structure: Home, Health Records \| Paw FAB \| Wellness, Settings |
| Active affordance | Single **sliding circular pill** behind the active side tab (reference-2 style) |
| Animation stack | Existing React Native `Animated` with `useNativeDriver: true` (no Reanimated) |
| Labels | Keep short labels under icons |
| Functionality | Unchanged: jump-to-root, FAB → Pets, long-press → orbit pet picker |
| Haptics | Optional, dependency-free only (`Vibration` / platform-safe light feedback); skip if noisy or inconsistent |
| Insets | Keep `TAB_BAR_VISUAL_HEIGHT` / `useAppTabBarInset` contract unless visual height truly changes |

## Current baseline

- Custom tab bar: `src/app/navigation/components/PawTabBar.tsx`
- Wired via `createBottomTabNavigator` + `tabBar={renderPawTabBar}` in `AppNavigator.tsx`
- Already has: press scale springs, per-tab active opacity crossfade, FAB press scale, FAB lift when Pets becomes active, long-press orbit pet picker
- Active state today: static `primaryLight` chip background on the selected `TabSlot` (no shared sliding indicator)
- No `react-native-reanimated` direct dependency; project already uses RN `Animated` elsewhere

## Scope

### In

1. Replace per-tab static active chip background with one shared sliding circular indicator that springs between measured side-tab centers.
2. Keep icon accent/subdued color treatment; active icon sits on the sliding pill.
3. Retain press scale on tabs and FAB; retain FAB lift when entering Pets.
4. Measure tab centers on layout / window width change; avoid recreating `Animated.Value` instances on every render.
5. Keep `React.memo` on tab slots; prefer transform/opacity animations for native-driver performance.
6. Preserve pet picker Modal behavior and accessibility labels/roles/selected state.

### Out

1. Floating white island / fully detached pill shell redesign (reference 2 container).
2. Dark curved SVG notch bar redesign (reference 1 shell).
3. Adding `react-native-reanimated` or gesture-handler solely for this polish.
4. Changing tab routes, labels meaning, FAB actions, or pet-picker flow.
5. Icon-only / label-removed navigation.
6. Broad redesign of theme tokens or other screens.

## Interaction design

### Side tabs

- Four side tabs remain in two groups around the FAB gap.
- On tab change between side tabs, the circular pill **springs** (`translateX`, optional slight scale squash while traveling) to the new tab’s measured center.
- When Pets (FAB) is selected, side-tab pill is hidden or faded out (FAB remains the active affordance via existing border/lift).
- Press: scale to ~0.93 on press-in, spring back on release (existing feel, keep).

### Center FAB

- Unchanged behavior: tap → Pets tab root; long-press → pet orbit picker.
- Keep press scale and Pets-active border / lift micro-interaction.

### Labels

- Keep Home / Health Records / Wellness / Settings labels for clarity.
- Active label uses accent + bold; inactive uses subdued (existing pattern).

## Performance constraints

- Prefer a **single** shared indicator `Animated.Value` for horizontal position (and optional scale), not four independent background animations.
- All motion on the indicator and press feedback must use `useNativeDriver: true` where supported (transform / opacity only).
- Do not animate `backgroundColor` or layout width of the pill on the JS thread every frame; use fixed pill size + `translateX`.
- Measure once per relevant layout change; store centers in refs.
- Avoid layout thrash: indicator is absolutely positioned relative to the bar row, not reflowing siblings.

## Architecture touchpoints

| Unit | Responsibility |
| --- | --- |
| `PawTabBar` | Owns indicator position state, layout measurement, FAB + pet picker, navigation jumps |
| `TabSlot` | Renders icon + label + press handlers; reports layout center via `onLayout` / measure callback; no local active background chip |
| `layout.ts` | Height / inset contract; update only if visual height changes |

No store, use-case, or cross-feature changes.

## Error / edge cases

- Window rotation / font scale / foldable width change → remeasure and snap or spring indicator to current active tab.
- Rapid tab taps → latest target wins; do not queue conflicting springs.
- Zero pets / pet picker empty path unchanged.
- Keyboard hide (`tabBarHideOnKeyboard`) unchanged.

## Testing

1. Manual: switch among all four side tabs — pill slides smoothly, no jank.
2. Manual: select Pets via FAB — side pill hidden/faded; FAB active treatment visible.
3. Manual: long-press FAB — orbit picker still works; dismiss still works.
4. Manual: nested stack pop-to-root behavior on re-tap focused tab unchanged.
5. Manual: light/dark theme — pill and icons remain readable against `tabBarBackground`.
6. Smoke: Home → Health → Wellness → Settings → Pets → back; scroll insets still clear the bar.

## Success criteria

- Same destinations and gestures as today.
- Active side tab reads clearly via sliding circular highlight.
- Motion feels springy and continuous; stays on native driver.
- No new animation libraries added for this work.
