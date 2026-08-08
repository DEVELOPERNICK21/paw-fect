# Firebase Analytics Design (Dual with PostHog)

**Date:** 2026-08-09  
**Status:** Approved for planning  
**Approach:** Shared analytics facade → PostHog + Firebase Analytics

## Goal

Add Firebase Analytics (`@react-native-firebase/analytics`) to the React Native app while keeping PostHog. All product analytics go through one infrastructure facade so event names, screens, and user identity stay aligned across both backends.

## Decisions

| Topic | Choice |
| --- | --- |
| Relation to PostHog | Dual tracking (keep PostHog) |
| Event coverage (v1) | Automatic collection + screens + user id + mirror existing PostHog custom events (includes core funnel) |
| Consent | Always on in release; collection disabled in `__DEV__`; no Settings toggle in v1 |
| Integration style | Shared facade (Approach 2), not dual call sites |

## Scope

### In

- Install `@react-native-firebase/analytics` aligned with existing Firebase packages (`23.8.8`)
- Infrastructure facade: `trackEvent`, `trackScreen`, `identifyUser`, `resetUser`, collection gating
- Wire `RootNavigator` screen views and auth identify/reset through the facade
- Migrate existing `posthog.capture` call sites to `trackEvent`
- Unit tests for the facade (mocked PostHog + Firebase)
- Fail-soft: Firebase errors never crash the RN shell

### Out

- In-app analytics opt-out toggle
- Removing or replacing PostHog
- Web / marketing-site Firebase Analytics
- Privacy policy rewrite (optional follow-up; product analytics already disclosed)
- Changing Crashlytics user sync (remains separate)

## Architecture

```
UI / navigators
  → analytics facade (infrastructure)
      → PostHog client (existing `src/config/posthog.ts`)
      → Firebase Analytics (new thin wrapper)
```

| Unit | Path | Responsibility |
| --- | --- | --- |
| Facade | `src/infrastructure/analytics/analytics.ts` | Public API used by UI; fans out; `__DEV__` collection gate |
| Firebase adapter | `src/infrastructure/analytics/firebaseAnalytics.ts` | RN Firebase calls (`logEvent`, `logScreenView`, `setUserId`, `setAnalyticsCollectionEnabled`); try/catch |
| PostHog client | `src/config/posthog.ts` | Existing client; facade imports it (UI stops calling it for capture/screen/identify/reset) |
| Crashlytics sync | `src/infrastructure/crashlytics/registerCrashlyticsUserSync.ts` | Unchanged; separate from Analytics |

**Dependency rule:** UI and stores must not import `@react-native-firebase/analytics` directly. Only the Firebase adapter may.

## Behavior

### Collection

- On app bootstrap (facade init): `setAnalyticsCollectionEnabled(!__DEV__)` for Firebase
- PostHog continues to use its existing `disabled` / `debug` config
- No user-facing opt-out in v1

### Screens

- Source of truth: `NavigationContainer` `onStateChange` in `RootNavigator` (already tracks route name)
- Facade `trackScreen(screenName, { previous_screen })`:
  - PostHog: `posthog.screen(...)`
  - Firebase: `logScreenView({ screen_name, screen_class })` (use route name for both name and class unless a clearer class exists)

### Identity

- When authenticated user is present: PostHog `identify` (keep current `$set` traits) + Firebase `setUserId(user.id)`
- On logout / no user: PostHog `reset` + Firebase `setUserId('')` to clear the Analytics user id
- Do not send email or display name as Firebase Analytics event parameters
- Crashlytics user id sync stays as-is

### Bootstrap

- Call facade `initAnalytics()` once after the app shell mounts (same timing as `registerCrashlyticsUserSync`: not at module import), so the native bridge is ready before `setAnalyticsCollectionEnabled`

### Custom events (mirror existing PostHog names)

Use snake_case names and GA4-safe param types (string | number | boolean only).

| Domain | Events |
| --- | --- |
| Auth | `user_signed_up`, `user_logged_in` |
| Onboarding | `onboarding_step_viewed`, `onboarding_plan_revealed`, `onboarding_problem_selected`, `onboarding_commitment_completed`, `onboarding_completed` |
| Pets | `pet_profile_created`, `pet_profile_updated` |
| Care | `reminder_created`, `health_record_added` |
| Paywall | `paywall_viewed`, `paywall_dismissed`, `paywall_skipped_entitled`, `subscription_checkout_started` |

**Known call sites to migrate**

- `src/app/navigation/RootNavigator.tsx` (screen + identify/reset)
- `src/modules/auth/ui/screens/LoginScreen.tsx`
- `src/modules/app/ui/screens/OnboardingScreen.tsx`
- `src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx`
- `src/modules/app/ui/onboarding/tips/OnboardingTipsScreen.tsx`
- `src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx`
- `src/modules/pets/ui/screens/AddPetScreen.tsx`
- `src/modules/reminders/ui/screens/AddReminderScreen.tsx`
- `src/modules/records/ui/screens/AddHealthRecordScreen.tsx`
- `src/modules/subscription/ui/screens/PaywallScreen.tsx`

PostHogProvider may remain for feature flags / autocapture touches; screen capture stays manual via facade (`captureScreens: false` unchanged).

## Error handling

- All Firebase Analytics native calls wrapped; failures logged only in `__DEV__` (same spirit as Crashlytics fail-soft)
- Facade never throws to UI

## Testing

- Unit: facade fans out to mocked PostHog + Firebase adapters; respects collection-disabled path
- Manual: release or Firebase DebugView → confirm `screen_view` + one custom event in Firebase console

## Success criteria

1. `@react-native-firebase/analytics` installed and linked for Android/iOS via existing Google Services configs
2. No direct `posthog.capture` / `posthog.screen` / `posthog.identify` / `posthog.reset` remaining in feature UI (except config + facade)
3. Same event names appear in both PostHog and Firebase for migrated flows
4. `__DEV__` does not pollute production GA4 (collection disabled)
5. Facade unit tests pass
