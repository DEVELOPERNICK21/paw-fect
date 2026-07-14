# Interactive Onboarding Design

**Date:** 2026-07-15  
**Status:** Approved for planning  
**Approach:** Single-screen polish + local interactivity (RN `Animated`, no new native motion deps)

## Goal

Make the existing Pawfect onboarding more interactive while preserving brand and architecture: theme tokens only, Clean Architecture via settings store, and a familiar 3-feature tour plus a short prefs step.

## Scope

**In**
- 4-step onboarding in `OnboardingScreen` (no new navigator routes)
- Horizontal paging + RN `Animated` step transitions
- Tap-to-highlight demo interactions on steps 1–3 (ephemeral UI state)
- Step 4 care-interest multi-select persisted on `Settings`
- Progress UI for 4 steps; PostHog updates
- Light + dark via `useTheme()`

**Out**
- Reanimated / Gesture Handler carousel
- Creating real pets from onboarding
- Syncing `careInterests` to Firebase / `User` profile
- Redesigning Settings UI to edit care interests (can land later)

## UX Flow

| Step | Title intent | Interaction | Persisted? |
|------|----------------|-------------|------------|
| 0 | Health Tracking Made Simple | Tap Activity / Nutrition / Vitals chips | No (demo) |
| 1 | Never miss a moment | Tap reminder cards + feature rows | No (demo) |
| 2 | Manage All Your Pets | Tap Luna / Milo / Add New visual select | No (demo) |
| 3 | Care interests | Multi-select Vaccines / Walks / Meds / Grooming | Yes |

**CTA**
- Steps 0–2: Get Started / Next
- Step 3: Save & Continue (enabled only when ≥1 interest selected)
- Skip: still available (completes onboarding with `careInterests: []` if none chosen)
- Back: preserves demo highlights and care-interest selections while paging

**Motion**
- Fade/slide on step change via React Native `Animated`
- Progress fill for `step + 1` of 4
- Optional press scale on selectable cards (token-safe shadows only)

## Architecture

```
OnboardingScreen (UI)
  → local React state for step + demo selections + careInterests draft
  → useSettingsStore.updateSettings on complete/skip
    → UpdateSettings use case → SettingsRepository → SettingsLocalDataSource
```

No store-to-store coupling. Demo selections never leave the screen.

### Settings model

```ts
export type CareInterest = 'vaccines' | 'walks' | 'meds' | 'grooming';

export interface Settings {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  onboardingCompleted: boolean;
  themeMode: ThemePreference;
  careInterests: CareInterest[];
}
```

- Default: `careInterests: []`
- Load merge: `{ ...DEFAULT_SETTINGS, ...stored }` so older installs without the field stay valid
- Complete: `{ ...settings, onboardingCompleted: true, careInterests }`
- Skip: `{ ...settings, onboardingCompleted: true, careInterests }` (empty array if none selected)

`RootNavigator` continues to gate on `settings.onboardingCompleted` only.

### Analytics

- `onboarding_step_viewed`: `{ step, total_steps: 4 }`
- `onboarding_completed`: `{ skipped, care_interests: string[] }`

## UI / Theme

- All feature styles from `useTheme()` (`colors`, `spacing`/`space`, `radius`, `fontFamilies`)
- Selected states: `colors.accent` + `brandTint*` borders/fills
- No hardcoded hex in feature UI
- Reuse existing onboarding layout language (24 radius cards, accent CTA, progress track)

## Edge Cases

- Missing `careInterests` in storage → `[]`
- Step 3 primary disabled until ≥1 chip selected; Skip always allowed
- Rapid back/forward keeps local state
- No auth `User.onboardingCompleted` write in this pass (settings remains source of truth for the gate)

## Testing

1. Unit / data: default settings include `careInterests: []`; merge fills missing field
2. Complete with selections writes `onboardingCompleted: true` and chosen interests
3. Skip writes completed + empty interests
4. Manual: light + dark, paging, chip gating, Skip path

## File touch list (planned)

- `src/modules/app/ui/screens/OnboardingScreen.tsx` (primary)
- `src/modules/settings/domain/models/Settings.ts`
- `src/modules/settings/data/datasources/SettingsLocalDataSource.ts`
- Optional: thin presentational helpers under `src/modules/app/ui/components/` if screen size warrants
- Tests colocated under settings and/or app UI as appropriate

## Success Criteria

- User can swipe/page and tap through a lively 4-step flow that matches Pawfect theme
- Choosing care interests persists across app restarts via settings storage
- Skip and complete both exit onboarding as today
- No new native animation dependencies
