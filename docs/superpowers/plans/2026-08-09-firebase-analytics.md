# Firebase Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase Analytics alongside PostHog via a shared infrastructure facade so screens, identity, and existing custom events dual-track without UI importing Firebase Analytics directly.

**Architecture:** `createAnalytics(deps)` owns `initAnalytics`, `trackEvent`, `trackScreen`, `identifyUser`, and `resetUser`. Default deps wire the existing PostHog client and a fail-soft Firebase adapter. UI call sites migrate from direct PostHog APIs to the facade. Collection is disabled when `isDev` is true.

**Tech Stack:** React Native 0.84, TypeScript, `@react-native-firebase/analytics@23.8.8`, existing `posthog-react-native`, Jest.

**Spec:** `docs/superpowers/specs/2026-08-09-firebase-analytics-design.md`

## Global Constraints

- Firebase Analytics package version must align with existing Firebase packages: `23.8.8`
- UI / stores must not import `@react-native-firebase/analytics` (only `firebaseAnalytics.ts` may)
- Event names stay snake_case; params are `string | number | boolean` only
- Do not put email / display name in Firebase event params
- Firebase calls must never throw into UI (`try/catch`, `__DEV__` log only)
- No Settings opt-out toggle in v1
- Keep PostHogProvider for feature flags / touch autocapture; `captureScreens: false` unchanged
- Crashlytics user sync remains separate and unchanged

---

## File map

| File | Responsibility |
|------|----------------|
| `package.json` / lockfile | Add `@react-native-firebase/analytics@23.8.8` |
| `src/infrastructure/analytics/types.ts` | Shared param + deps types |
| `src/infrastructure/analytics/firebaseAnalytics.ts` | Fail-soft RN Firebase adapter |
| `src/infrastructure/analytics/analytics.ts` | Facade factory + default export bindings |
| `src/infrastructure/analytics/__tests__/analytics.test.ts` | Facade unit tests |
| `src/app/navigation/RootNavigator.tsx` | `initAnalytics`, screen + identify/reset via facade |
| Feature screens listed in Task 4 | Replace `posthog.capture` with `trackEvent` |

---

### Task 1: Install `@react-native-firebase/analytics`

**Files:**
- Modify: `package.json`
- Modify: lockfile via yarn
- Native: no new Google Services files (already present under `android/app/google-services.json` and `ios/**/GoogleService-Info.plist`)

**Interfaces:**
- Consumes: existing Firebase app bootstrap
- Produces: dependency `@react-native-firebase/analytics@23.8.8` available to TypeScript and Metro

- [ ] **Step 1: Add the package**

Run:

```bash
yarn add @react-native-firebase/analytics@23.8.8
```

Expected: `package.json` lists `"@react-native-firebase/analytics": "23.8.8"` (exact or caret matching other Firebase entries is fine if yarn resolves to 23.8.8).

- [ ] **Step 2: iOS pods (if on macOS)**

From repo root:

```bash
bundle exec pod install --project-directory=ios
```

Expected: pods install without error; Analytics pod present in the Podfile.lock / install output.

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock ios/Podfile.lock
git commit -m "$(cat <<'EOF'
chore: add @react-native-firebase/analytics 23.8.8

EOF
)"
```

---

### Task 2: Analytics types + Firebase adapter + facade (TDD)

**Files:**
- Create: `src/infrastructure/analytics/types.ts`
- Create: `src/infrastructure/analytics/firebaseAnalytics.ts`
- Create: `src/infrastructure/analytics/analytics.ts`
- Create: `src/infrastructure/analytics/__tests__/analytics.test.ts`

**Interfaces:**
- Consumes: PostHog-like client shape; Firebase adapter port
- Produces:
  - `AnalyticsParams = Record<string, string | number | boolean>`
  - `IdentifyTraits = { email?: string; displayName?: string }`
  - `FirebaseAnalyticsPort` with `setCollectionEnabled`, `logEvent`, `logScreenView`, `setUserId`
  - `createAnalytics(deps)` returning `{ initAnalytics, trackEvent, trackScreen, identifyUser, resetUser }`
  - Default exports: `initAnalytics`, `trackEvent`, `trackScreen`, `identifyUser`, `resetUser` bound to real PostHog + `createFirebaseAnalyticsPort()`

- [ ] **Step 1: Write the failing tests**

Create `src/infrastructure/analytics/__tests__/analytics.test.ts`:

```typescript
import { createAnalytics } from '../analytics';
import type { FirebaseAnalyticsPort } from '../types';

function createMockFirebase(): jest.Mocked<FirebaseAnalyticsPort> {
  return {
    setCollectionEnabled: jest.fn(async () => undefined),
    logEvent: jest.fn(async () => undefined),
    logScreenView: jest.fn(async () => undefined),
    setUserId: jest.fn(async () => undefined),
  };
}

function createMockPostHog() {
  return {
    capture: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  };
}

describe('createAnalytics', () => {
  it('disables Firebase collection in dev on init', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: true,
    });

    await analytics.initAnalytics();

    expect(firebase.setCollectionEnabled).toHaveBeenCalledWith(false);
  });

  it('enables Firebase collection when not in dev', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.initAnalytics();

    expect(firebase.setCollectionEnabled).toHaveBeenCalledWith(true);
  });

  it('fans trackEvent out to PostHog and Firebase', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.trackEvent('user_logged_in', { method: 'email' });

    expect(posthog.capture).toHaveBeenCalledWith('user_logged_in', {
      method: 'email',
    });
    expect(firebase.logEvent).toHaveBeenCalledWith('user_logged_in', {
      method: 'email',
    });
  });

  it('fans trackScreen out to PostHog and Firebase', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.trackScreen('Home', { previous_screen: 'Login' });

    expect(posthog.screen).toHaveBeenCalledWith('Home', {
      previous_screen: 'Login',
    });
    expect(firebase.logScreenView).toHaveBeenCalledWith({
      screen_name: 'Home',
      screen_class: 'Home',
    });
  });

  it('identifyUser sets PostHog traits and Firebase user id', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.identifyUser('uid-1', {
      email: 'a@b.com',
      displayName: 'Ada',
    });

    expect(posthog.identify).toHaveBeenCalledWith('uid-1', {
      $set: {
        email: 'a@b.com',
        display_name: 'Ada',
      },
    });
    expect(firebase.setUserId).toHaveBeenCalledWith('uid-1');
    expect(firebase.logEvent).not.toHaveBeenCalled();
  });

  it('resetUser resets PostHog and clears Firebase user id', async () => {
    const firebase = createMockFirebase();
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await analytics.resetUser();

    expect(posthog.reset).toHaveBeenCalled();
    expect(firebase.setUserId).toHaveBeenCalledWith('');
  });

  it('swallows Firebase errors so callers are not rejected', async () => {
    const firebase = createMockFirebase();
    firebase.logEvent.mockRejectedValueOnce(new Error('native boom'));
    const posthog = createMockPostHog();
    const analytics = createAnalytics({
      posthog,
      firebase,
      isDev: false,
    });

    await expect(
      analytics.trackEvent('reminder_created', { has_notes: true }),
    ).resolves.toBeUndefined();
    expect(posthog.capture).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
yarn test -- src/infrastructure/analytics/__tests__/analytics.test.ts
```

Expected: FAIL (module / exports missing).

- [ ] **Step 3: Implement types**

Create `src/infrastructure/analytics/types.ts`:

```typescript
export type AnalyticsParams = Record<string, string | number | boolean>;

export type IdentifyTraits = {
  email?: string;
  displayName?: string;
};

export type PostHogAnalyticsClient = {
  capture: (event: string, properties?: AnalyticsParams) => void;
  screen: (name: string, properties?: AnalyticsParams) => void;
  identify: (
    distinctId: string,
    properties?: { $set?: Record<string, string | undefined> },
  ) => void;
  reset: () => void;
};

export type FirebaseAnalyticsPort = {
  setCollectionEnabled: (enabled: boolean) => Promise<void>;
  logEvent: (name: string, params?: AnalyticsParams) => Promise<void>;
  logScreenView: (params: {
    screen_name: string;
    screen_class: string;
  }) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
};

export type AnalyticsDeps = {
  posthog: PostHogAnalyticsClient;
  firebase: FirebaseAnalyticsPort;
  isDev: boolean;
};

export type AnalyticsFacade = {
  initAnalytics: () => Promise<void>;
  trackEvent: (name: string, params?: AnalyticsParams) => Promise<void>;
  trackScreen: (
    screenName: string,
    params?: AnalyticsParams,
  ) => Promise<void>;
  identifyUser: (userId: string, traits?: IdentifyTraits) => Promise<void>;
  resetUser: () => Promise<void>;
};
```

- [ ] **Step 4: Implement Firebase adapter**

Create `src/infrastructure/analytics/firebaseAnalytics.ts`:

```typescript
import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  logScreenView as firebaseLogScreenView,
  setAnalyticsCollectionEnabled,
  setUserId as firebaseSetUserId,
} from '@react-native-firebase/analytics';

import type { AnalyticsParams, FirebaseAnalyticsPort } from './types';

const logAnalyticsError = (scope: string, error: unknown): void => {
  if (!__DEV__) {
    return;
  }
  console.error(`[analytics] ${scope}`, error);
};

export function createFirebaseAnalyticsPort(): FirebaseAnalyticsPort {
  return {
    setCollectionEnabled: async (enabled: boolean): Promise<void> => {
      try {
        await setAnalyticsCollectionEnabled(getAnalytics(), enabled);
      } catch (error) {
        logAnalyticsError('setCollectionEnabled', error);
      }
    },
    logEvent: async (name: string, params?: AnalyticsParams): Promise<void> => {
      try {
        await firebaseLogEvent(getAnalytics(), name, params);
      } catch (error) {
        logAnalyticsError(`logEvent:${name}`, error);
      }
    },
    logScreenView: async (params: {
      screen_name: string;
      screen_class: string;
    }): Promise<void> => {
      try {
        await firebaseLogScreenView(getAnalytics(), params);
      } catch (error) {
        logAnalyticsError('logScreenView', error);
      }
    },
    setUserId: async (userId: string): Promise<void> => {
      try {
        await firebaseSetUserId(getAnalytics(), userId);
      } catch (error) {
        logAnalyticsError('setUserId', error);
      }
    },
  };
}
```

If the installed modular API names differ slightly, match the package’s exported names while keeping this port’s signatures unchanged.

- [ ] **Step 5: Implement facade**

Create `src/infrastructure/analytics/analytics.ts`:

```typescript
import { posthog } from '../../config/posthog';

import { createFirebaseAnalyticsPort } from './firebaseAnalytics';
import type {
  AnalyticsDeps,
  AnalyticsFacade,
  AnalyticsParams,
  IdentifyTraits,
} from './types';

export function createAnalytics(deps: AnalyticsDeps): AnalyticsFacade {
  const { posthog: ph, firebase, isDev } = deps;

  const initAnalytics = async (): Promise<void> => {
    await firebase.setCollectionEnabled(!isDev);
  };

  const trackEvent = async (
    name: string,
    params?: AnalyticsParams,
  ): Promise<void> => {
    try {
      ph.capture(name, params);
    } catch {
      /* PostHog must not tear down UI */
    }
    await firebase.logEvent(name, params);
  };

  const trackScreen = async (
    screenName: string,
    params?: AnalyticsParams,
  ): Promise<void> => {
    try {
      ph.screen(screenName, params);
    } catch {
      /* PostHog must not tear down UI */
    }
    await firebase.logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  };

  const identifyUser = async (
    userId: string,
    traits?: IdentifyTraits,
  ): Promise<void> => {
    try {
      ph.identify(userId, {
        $set: {
          email: traits?.email,
          display_name: traits?.displayName,
        },
      });
    } catch {
      /* PostHog must not tear down UI */
    }
    await firebase.setUserId(userId);
  };

  const resetUser = async (): Promise<void> => {
    try {
      ph.reset();
    } catch {
      /* PostHog must not tear down UI */
    }
    await firebase.setUserId('');
  };

  return {
    initAnalytics,
    trackEvent,
    trackScreen,
    identifyUser,
    resetUser,
  };
}

const defaultAnalytics = createAnalytics({
  posthog,
  firebase: createFirebaseAnalyticsPort(),
  isDev: __DEV__,
});

export const initAnalytics = defaultAnalytics.initAnalytics;
export const trackEvent = defaultAnalytics.trackEvent;
export const trackScreen = defaultAnalytics.trackScreen;
export const identifyUser = defaultAnalytics.identifyUser;
export const resetUser = defaultAnalytics.resetUser;
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
yarn test -- src/infrastructure/analytics/__tests__/analytics.test.ts
```

Expected: PASS (all cases green).

- [ ] **Step 7: Commit**

```bash
git add src/infrastructure/analytics
git commit -m "$(cat <<'EOF'
feat(analytics): add PostHog + Firebase dual-tracking facade

EOF
)"
```

---

### Task 3: Bootstrap + RootNavigator identity/screens

**Files:**
- Modify: `src/app/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `initAnalytics`, `trackScreen`, `identifyUser`, `resetUser` from `src/infrastructure/analytics/analytics.ts`
- Produces: Analytics initialized after bootstrap; screen views and auth identity dual-tracked

- [ ] **Step 1: Import facade APIs**

Near the Crashlytics import in `RootNavigator.tsx`, add:

```typescript
import {
  identifyUser,
  initAnalytics,
  resetUser,
  trackScreen,
} from '../../infrastructure/analytics/analytics';
```

Remove direct use of `posthog.identify`, `posthog.reset`, and `posthog.screen` in this file (keep `posthog` import only if still required for `PostHogProvider`).

- [ ] **Step 2: Call `initAnalytics` with Crashlytics timing**

In the existing `useEffect` that runs when `bootstrapped` becomes true and currently calls `registerCrashlyticsUserSync()`, also start analytics:

```typescript
useEffect(() => {
  if (!bootstrapped) {
    return;
  }
  registerCrashlyticsUserSync();
  void initAnalytics();
  startupLog('post_bootstrap.notifications.begin');
  void bootstrapLocalNotifications()
    .then(() => startupLog('post_bootstrap.notifications.done'))
    .catch(error => startupError('post_bootstrap.notifications', error));
}, [bootstrapped]);
```

- [ ] **Step 3: Replace identify / reset**

Replace the auth `useEffect` that calls PostHog directly with:

```typescript
useEffect(() => {
  if (user?.id) {
    void identifyUser(user.id, {
      email: user.email ?? undefined,
      displayName: user.displayName ?? undefined,
    });
  } else if (userId === null || userId === undefined) {
    void resetUser();
  }
}, [user, userId]);
```

- [ ] **Step 4: Replace screen tracking**

In `onStateChange`, replace `posthog.screen(...)` with:

```typescript
void trackScreen(currentRouteName, {
  previous_screen: previousRouteName ?? '',
});
```

Only call when `previousRouteName !== currentRouteName && currentRouteName` (same guard as today). If `previousRouteName` is undefined on first transition, pass `''` or omit — prefer including `previous_screen` only when defined:

```typescript
void trackScreen(
  currentRouteName,
  previousRouteName
    ? { previous_screen: previousRouteName }
    : undefined,
);
```

- [ ] **Step 5: Typecheck / smoke**

Run:

```bash
npx tsc --noEmit
yarn test -- src/infrastructure/analytics/__tests__/analytics.test.ts
```

Expected: no new TS errors; analytics tests still PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/navigation/RootNavigator.tsx
git commit -m "$(cat <<'EOF'
feat(analytics): wire init, screens, and identity in RootNavigator

EOF
)"
```

---

### Task 4: Migrate feature `posthog.capture` call sites

**Files:**
- Modify: `src/modules/auth/ui/screens/LoginScreen.tsx`
- Modify: `src/modules/app/ui/screens/OnboardingScreen.tsx`
- Modify: `src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx`
- Modify: `src/modules/app/ui/onboarding/tips/OnboardingTipsScreen.tsx`
- Modify: `src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx`
- Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx`
- Modify: `src/modules/reminders/ui/screens/AddReminderScreen.tsx`
- Modify: `src/modules/records/ui/screens/AddHealthRecordScreen.tsx`
- Modify: `src/modules/subscription/ui/screens/PaywallScreen.tsx`

**Interfaces:**
- Consumes: `trackEvent(name, params?)` from facade
- Produces: no remaining `posthog.capture` / `usePostHog` usage for these events in feature UI

For **each** file below, apply the same pattern:

1. Remove `import { usePostHog } from 'posthog-react-native'` if unused after migration.
2. Add `import { trackEvent } from '../../../../infrastructure/analytics/analytics';` (adjust relative depth per file).
3. Remove `const posthog = usePostHog();`.
4. Replace `posthog.capture('event', props)` with `void trackEvent('event', props)`.
5. Drop `posthog` from dependency arrays.

Exact event map (do not rename):

| File | Events |
|------|--------|
| `LoginScreen.tsx` | `user_signed_up` `{ method: 'email' }`; `user_logged_in` `{ method: 'email' \| 'google' }` |
| `OnboardingScreen.tsx` | `onboarding_step_viewed`; `onboarding_completed` |
| `OnboardingFunnelScreen.tsx` | `onboarding_step_viewed`; `onboarding_plan_revealed`; `onboarding_problem_selected`; `onboarding_commitment_completed` |
| `OnboardingTipsScreen.tsx` | `onboarding_completed` |
| `OnboardingPaywallHost.tsx` | `paywall_skipped_entitled` `{ source: 'onboarding' }` |
| `AddPetScreen.tsx` | `pet_profile_updated`; `pet_profile_created` |
| `AddReminderScreen.tsx` | `reminder_created` `{ has_notes }` |
| `AddHealthRecordScreen.tsx` | `health_record_added` `{ category, has_notes }` |
| `PaywallScreen.tsx` | `paywall_viewed`; `paywall_dismissed`; `subscription_checkout_started` |

Example replacement in `LoginScreen.tsx`:

```typescript
import { trackEvent } from '../../../../infrastructure/analytics/analytics';

// inside handlers:
void trackEvent('user_signed_up', { method: 'email' });
void trackEvent('user_logged_in', { method: 'email' });
void trackEvent('user_logged_in', { method: 'google' });
```

Import path depth reminder:

- Screens under `src/modules/*/ui/screens/` → `../../../../infrastructure/analytics/analytics`
- Files under `src/modules/app/ui/onboarding/` → `../../../../infrastructure/analytics/analytics`
- Files under `src/modules/app/ui/onboarding/tips/` → `../../../../../infrastructure/analytics/analytics`

- [ ] **Step 1: Migrate auth + onboarding files**

Apply the pattern to:
- `LoginScreen.tsx`
- `OnboardingScreen.tsx`
- `OnboardingFunnelScreen.tsx`
- `OnboardingTipsScreen.tsx`
- `OnboardingPaywallHost.tsx`

- [ ] **Step 2: Migrate pets / reminders / records / paywall**

Apply the pattern to:
- `AddPetScreen.tsx`
- `AddReminderScreen.tsx`
- `AddHealthRecordScreen.tsx`
- `PaywallScreen.tsx`

- [ ] **Step 3: Verify no stray capture calls in feature UI**

Run:

```bash
rg "posthog\\.capture|usePostHog" src --glob '*.tsx' --glob '*.ts'
```

Expected: no matches in feature UI. Allowed leftovers only if something still needs PostHog flags via `usePostHog` — if none, zero matches. `src/config/posthog.ts` and `RootNavigator` PostHogProvider import of `posthog` client may remain.

Also confirm RootNavigator no longer calls `posthog.screen` / `identify` / `reset`:

```bash
rg "posthog\\.(capture|screen|identify|reset)" src --glob '*.tsx' --glob '*.ts'
```

Expected: matches only inside `src/infrastructure/analytics/analytics.ts` (and possibly tests).

- [ ] **Step 4: Typecheck**

Run:

```bash
npx tsc --noEmit
yarn test -- src/infrastructure/analytics/__tests__/analytics.test.ts
```

Expected: PASS / no new errors.

- [ ] **Step 5: Commit**

```bash
git add \
  src/modules/auth/ui/screens/LoginScreen.tsx \
  src/modules/app/ui/screens/OnboardingScreen.tsx \
  src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx \
  src/modules/app/ui/onboarding/tips/OnboardingTipsScreen.tsx \
  src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx \
  src/modules/pets/ui/screens/AddPetScreen.tsx \
  src/modules/reminders/ui/screens/AddReminderScreen.tsx \
  src/modules/records/ui/screens/AddHealthRecordScreen.tsx \
  src/modules/subscription/ui/screens/PaywallScreen.tsx
git commit -m "$(cat <<'EOF'
feat(analytics): route product events through dual-tracking facade

EOF
)"
```

---

### Task 5: Manual verification checklist

**Files:** none (manual QA)

- [ ] **Step 1: Dev collection off**

Run a debug build (`yarn ios` or `yarn android`). Confirm app boots. In `__DEV__`, Firebase collection should be disabled (no requirement to see events in GA4 from debug).

- [ ] **Step 2: Release / DebugView (optional but recommended)**

Either:
- Build a release variant, or
- Enable Firebase Analytics DebugView for the device

Then: open the app → navigate across 2 screens → complete one custom action (e.g. open paywall or log in). Confirm in Firebase console: `screen_view` + at least one custom event name from the spec list.

- [ ] **Step 3: Final grep gate**

```bash
rg "@react-native-firebase/analytics" src --glob '*.ts' --glob '*.tsx'
```

Expected: import only from `src/infrastructure/analytics/firebaseAnalytics.ts`.

- [ ] **Step 4: Commit nothing if QA-only; otherwise fix and commit**

If QA finds a bug, fix in a dedicated commit, e.g.:

```bash
git commit -m "$(cat <<'EOF'
fix(analytics): address dual-tracking QA findings

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Install `@react-native-firebase/analytics` 23.8.8 | Task 1 |
| Facade APIs + `__DEV__` collection gate | Task 2 |
| Fail-soft Firebase adapter | Task 2 |
| `initAnalytics` after shell mount | Task 3 |
| Screen views dual-track | Task 3 |
| Identify / reset dual-track | Task 3 |
| Mirror all listed custom events | Task 4 |
| No direct Analytics imports from UI | Tasks 2–4 + Task 5 grep |
| Unit tests for facade | Task 2 |
| Manual DebugView / release check | Task 5 |
| Out of scope: opt-out, remove PostHog, web, privacy rewrite, Crashlytics changes | Not scheduled |
