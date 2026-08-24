# Onboarding Activation First-Win Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the psychology quiz onboarding with a short activation path: welcome → pet → first reminder → auth → real persist → paywall (honest Skip) → Home, with returning customers signing in from welcome and skipping the funnel.

**Architecture:** Slim the local onboarding draft + gate resolver; add an `OnboardingActivationPort` registered in `appComposition` so app UI never imports pets/reminders stores; create pet + reminder for real before paywall; drop tips phase; reuse paywall host entitled auto-skip; Pawly-inspired welcome using existing `petHd*` / `pawSoulLogo` assets and theme tokens.

**Tech Stack:** React Native 0.86, TypeScript, Zustand, Jest, existing Clean Architecture modules (`app`, `pets`, `reminders`, `auth`, `settings`), Notifee `requestNotificationPermission`.

**Spec:** `docs/superpowers/specs/2026-08-23-onboarding-activation-first-win-design.md`

## Global Constraints

- No dark patterns: no fake “building plan” theater, no commitment pledge, no guilt Skip, no fabricated stats, no paywall before first win.
- App module must not import pets/reminders stores or repositories — use coordination ports only.
- Theme tokens only in feature UI (`useTheme()`); no raw hex in onboarding screens.
- Walk reminder maps to `ReminderType` `'other'` with `repeat: 'daily'`; do not add a new reminder type in v1.
- Skip remains visible on onboarding paywall; entitled users auto-skip (keep host behavior).
- Primary KPI event: `onboarding_first_win_created`.
- YAGNI: do not delete old quiz step files in this plan (stop routing to them); optional cleanup later.
- Tests: `yarn test -- <path>`; types: `npx tsc --noEmit` when a task touches public types.

---

## Codebase name map (use these exact paths)

| Plan / spec name | Actual in repo |
|------------------|----------------|
| Draft model | `src/modules/app/domain/onboarding/OnboardingDraft.ts` |
| Reducers | `src/modules/app/domain/onboarding/onboardingDraftReducers.ts` |
| Gate | `src/modules/app/domain/onboarding/resolveOnboardingGate.ts` |
| Profile | `src/modules/app/domain/onboarding/OnboardingProfile.ts` (`ONBOARDING_QUIZ_VERSION`) |
| Profile builder | `src/modules/app/domain/onboarding/buildOnboardingProfile.ts` |
| Paywall copy | `src/modules/app/domain/onboarding/onboardingPaywallCopy.ts` |
| Draft store | `src/modules/app/store/onboardingDraftStore.ts` (`completeFunnel`) |
| Ports | `src/modules/app/store/onboardingCoordinationPorts.ts` |
| Composition | `src/modules/app/appComposition.ts` |
| Funnel UI today | `src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx` |
| Pet step today | `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx` |
| Paywall host | `src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx` |
| Tips (retire from nav) | `src/modules/app/ui/onboarding/tips/` |
| Navigator | `src/app/navigation/OnboardingNavigator.tsx` |
| Root | `src/app/navigation/RootNavigator.tsx` |
| Auth | `src/modules/auth/ui/screens/LoginScreen.tsx` |
| Reminder entry | `src/modules/reminders/domain/usecases/CreateReminderEntry.ts` |
| Reminder types | `vaccination` \| `medication` \| `grooming` \| `checkup` \| `other` |
| Notification ask | `requestNotificationPermission` in `src/infrastructure/notifications/notificationChannels.ts` |
| Hero assets | `src/shared/assets/images` → `petHd1`, `pawSoulLogo` / `appIcon` |

## File map

| File | Responsibility |
|------|----------------|
| `OnboardingDraft.ts` | Activation draft shape, phases, reminder draft types, `entryIntent` |
| `onboardingDraftReducers.ts` | Default draft, step/phase reducers, reminder/pet setters |
| `buildReminderDraftDefaults.ts` | **Create** — kind → date/time/repeat/title defaults |
| `normalizeOnboardingDraft.ts` | **Create** — legacy quiz draft → reset welcome |
| `resolveOnboardingGate.ts` | Gates: welcome / activate / auth / persist / paywall / complete |
| `buildOnboardingProfile.ts` | Empty legacy quiz fields OK; new version string |
| `OnboardingProfile.ts` | Bump `ONBOARDING_QUIZ_VERSION` to `activation_v1_2026-08` |
| `onboardingPaywallCopy.ts` | Soften/remove loss scare as default onboarding paywall copy |
| `onboardingCoordinationPorts.ts` | Add `OnboardingActivationPort` + register/get |
| `appComposition.ts` | Wire activation port to pets/reminders use cases |
| `onboardingDraftStore.ts` | Hydrate normalize; `persistFirstWin`; phase helpers |
| Onboarding draft data source under `src/modules/app/data/` | Persist new fields; normalize on read |
| `CreateReminderEntry.ts` | Accept explicit `ReminderRepeat` (needed for `daily`) |
| `OnboardingWelcomeScreen.tsx` | **Create** — Pawly-inspired welcome + Sign in |
| `OnboardingActivationScreen.tsx` | **Create** — shell for pet + reminder (step 1–2) |
| `steps/FirstReminderStep.tsx` | **Create** |
| `steps/PetBasicsStep.tsx` | Dog/cat only (hide `both`) |
| `OnboardingPersistScreen.tsx` | **Create** — real create + retry |
| `OnboardingPaywallHost.tsx` | After persist; advance to `done` (not tips); value copy |
| `OnboardingNavigator.tsx` | Route by new phases |
| `RootNavigator.tsx` | New gate branches; returning-user path |
| `LoginScreen.tsx` | Continuity: save reminder / returning sign-in |

---

### Task 1: Activation draft domain + reminder defaults + legacy normalize

**Files:**
- Modify: `src/modules/app/domain/onboarding/OnboardingDraft.ts`
- Modify: `src/modules/app/domain/onboarding/onboardingDraftReducers.ts`
- Create: `src/modules/app/domain/onboarding/buildReminderDraftDefaults.ts`
- Create: `src/modules/app/domain/onboarding/normalizeOnboardingDraft.ts`
- Test: `src/modules/app/domain/onboarding/__tests__/buildReminderDraftDefaults.test.ts`
- Test: `src/modules/app/domain/onboarding/__tests__/normalizeOnboardingDraft.test.ts`
- Test: update `src/modules/app/domain/onboarding/__tests__/onboardingDraftReducers.test.ts`

**Interfaces:**
- Produces: `ActivationReminderKind`, `ReminderDraft`, `OnboardingPhase` including `'welcome' \| 'activate' \| 'persist' \| 'paywall' \| 'done'`, `ACTIVATION_STEP_COUNT = 2`, `buildReminderDraftDefaults(kind, nickname, now)`, `normalizeOnboardingDraft(raw)`, `setReminderDraft`, `setCreatedPetId`

- [ ] **Step 1: Write failing tests for reminder defaults**

```ts
import { buildReminderDraftDefaults } from '../buildReminderDraftDefaults';

describe('buildReminderDraftDefaults', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  it('builds daily walk for tomorrow 08:00 as other', () => {
    const d = buildReminderDraftDefaults('walk', 'Milo', now);
    expect(d.kind).toBe('walk');
    expect(d.reminderType).toBe('other');
    expect(d.repeat).toBe('daily');
    expect(d.time).toBe('08:00');
    expect(d.title).toBe("Milo's walk");
    expect(d.date).toBe('2026-08-24'); // local date helper — assert via same helper used in impl
  });

  it('builds vaccination ~28 days out yearly', () => {
    const d = buildReminderDraftDefaults('vaccination', 'Milo', now);
    expect(d.reminderType).toBe('vaccination');
    expect(d.repeat).toBe('yearly');
    expect(d.time).toBe('09:00');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module missing)**

Run: `yarn test -- src/modules/app/domain/onboarding/__tests__/buildReminderDraftDefaults.test.ts`

- [ ] **Step 3: Implement types + defaults + normalize**

Update `OnboardingDraft.ts` (keep legacy quiz fields optional/empty for profile compat):

```ts
export type ActivationReminderKind =
  | 'walk'
  | 'vaccination'
  | 'medication'
  | 'checkup';

export type ReminderDraft = {
  kind: ActivationReminderKind;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  repeat: 'once' | 'daily' | 'yearly';
  reminderType: 'vaccination' | 'medication' | 'checkup' | 'other';
};

export type OnboardingPhase =
  | 'welcome'
  | 'activate'
  | 'persist'
  | 'paywall'
  | 'done';

export const ACTIVATION_STEP_COUNT = 2; // 0 pet, 1 reminder

export type OnboardingDraft = {
  step: number;
  petDraft: PetDraft | null;
  reminderDraft: ReminderDraft | null;
  createdPetId: string | null;
  phase: OnboardingPhase;
  skippedPaywall: boolean;
  paywallOutcome: PaywallOutcome | null;
  // legacy optional — leave empty on new path
  problems: OnboardingProblem[];
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
  commitmentAccepted: boolean;
  committedAt: string | null;
};
```

`buildReminderDraftDefaults.ts`: map kinds per spec table; use local date formatting consistent with reminders utils.

`normalizeOnboardingDraft.ts`:

```ts
export function isLegacyQuizDraft(draft: Partial<OnboardingDraft>): boolean {
  if (draft.phase === 'quiz' || draft.phase === 'tips') return true;
  if ((draft.problems?.length ?? 0) > 0 && !draft.reminderDraft) return true;
  if (draft.commitmentAccepted && draft.phase !== 'paywall' && draft.phase !== 'done' && draft.phase !== 'persist') {
    return true;
  }
  return false;
}

export function normalizeOnboardingDraft(
  raw: Partial<OnboardingDraft> | null,
): OnboardingDraft {
  const base = createDefaultOnboardingDraft();
  if (!raw) return base;
  if (isLegacyQuizDraft(raw)) return base; // reset to welcome
  return {
    ...base,
    ...raw,
    problems: raw.problems ?? [],
    careInterests: raw.careInterests ?? [],
    reminderDraft: raw.reminderDraft ?? null,
    createdPetId: raw.createdPetId ?? null,
    petDraft: raw.petDraft ?? null,
  };
}
```

Default draft: `phase: 'welcome'`, `step: 0`, empty arrays, null drafts.

- [ ] **Step 4: Write normalize tests + update reducer tests; run all three — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/modules/app/domain/onboarding/
git commit -m "feat(onboarding): add activation draft model and reminder defaults"
```

---

### Task 2: Rewrite `resolveOnboardingGate`

**Files:**
- Modify: `src/modules/app/domain/onboarding/resolveOnboardingGate.ts`
- Test: `src/modules/app/domain/onboarding/__tests__/resolveOnboardingGate.test.ts`

**Interfaces:**
- Consumes: new `OnboardingPhase`, draft readiness (`petDraft` + `reminderDraft`)
- Produces: `OnboardingGate = 'welcome' | 'activate' | 'auth' | 'persist' | 'paywall' | 'complete'`

- [ ] **Step 1: Rewrite failing tests for new gates**

```ts
describe('resolveOnboardingGate', () => {
  const base = {
    onboardingCompleted: false,
    isAuthenticated: false,
    hasPets: false,
    phase: 'welcome' as const,
    activationReady: false,
    firstWinPersisted: false,
  };

  it('complete when onboardingCompleted', () => {
    expect(resolveOnboardingGate({ ...base, onboardingCompleted: true })).toBe('complete');
  });

  it('complete when authenticated returning with pets', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        isAuthenticated: true,
        hasPets: true,
        phase: 'welcome',
      }),
    ).toBe('complete');
  });

  it('welcome when fresh', () => {
    expect(resolveOnboardingGate(base)).toBe('welcome');
  });

  it('activate when phase activate', () => {
    expect(resolveOnboardingGate({ ...base, phase: 'activate' })).toBe('activate');
  });

  it('auth when activationReady and not authenticated', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'activate',
        activationReady: true,
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('persist when authenticated, ready, not yet persisted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'persist',
        activationReady: true,
        isAuthenticated: true,
        firstWinPersisted: false,
      }),
    ).toBe('persist');
  });

  it('paywall when first win persisted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'paywall',
        isAuthenticated: true,
        firstWinPersisted: true,
        activationReady: true,
      }),
    ).toBe('paywall');
  });
});
```

- [ ] **Step 2: Run — FAIL on old signatures**

- [ ] **Step 3: Implement**

```ts
export type OnboardingGate =
  | 'welcome'
  | 'activate'
  | 'auth'
  | 'persist'
  | 'paywall'
  | 'complete';

export function resolveOnboardingGate(input: {
  onboardingCompleted: boolean;
  phase: OnboardingPhase;
  isAuthenticated: boolean;
  hasPets: boolean;
  activationReady: boolean; // petDraft + reminderDraft valid
  firstWinPersisted: boolean; // createdPetId != null OR phase past persist success
}): OnboardingGate {
  if (input.onboardingCompleted || input.phase === 'done') return 'complete';
  if (input.isAuthenticated && input.hasPets && input.phase === 'welcome') {
    return 'complete';
  }
  if (input.phase === 'paywall') {
    if (!input.isAuthenticated) return 'auth';
    return 'paywall';
  }
  if (input.phase === 'persist') {
    if (!input.isAuthenticated) return 'auth';
    return 'persist';
  }
  if (input.activationReady && !input.isAuthenticated) return 'auth';
  if (input.activationReady && input.isAuthenticated && !input.firstWinPersisted) {
    return 'persist';
  }
  if (input.phase === 'activate') return 'activate';
  if (input.phase === 'welcome') return 'welcome';
  return 'welcome';
}
```

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/modules/app/domain/onboarding/resolveOnboardingGate.ts \
  src/modules/app/domain/onboarding/__tests__/resolveOnboardingGate.test.ts
git commit -m "feat(onboarding): resolve activation gates instead of quiz funnel"
```

---

### Task 3: `CreateReminderEntry` daily support + activation port

**Files:**
- Modify: `src/modules/reminders/domain/usecases/CreateReminderEntry.ts`
- Modify: `src/modules/reminders/domain/usecases/__tests__/CreateReminderEntry.test.ts` (create if missing)
- Modify: `src/modules/app/store/onboardingCoordinationPorts.ts`
- Modify: `src/modules/app/appComposition.ts`
- Test: `src/modules/app/store/__tests__/onboardingActivationPort.test.ts` (optional thin mock test)

**Interfaces:**
- Produces:

```ts
export type ActivationPortResult =
  | { ok: true; petId: string }
  | { ok: false; errorMessage: string };

export type ReminderPortResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export interface OnboardingActivationPort {
  createPetFromDraft(input: {
    userId: string;
    pet: PetDraft;
  }): Promise<ActivationPortResult>;
  createReminderFromDraft(input: {
    petId: string;
    reminder: ReminderDraft;
  }): Promise<ReminderPortResult>;
}
```

- [ ] **Step 1: Failing test — CreateReminderEntry accepts `repeat: ReminderRepeat`**

```ts
it('allows daily repeat', () => {
  const result = new CreateReminderEntry().execute({
    petId: 'p1',
    title: "Milo's walk",
    type: 'other',
    date: '2099-01-02',
    time: '08:00',
    repeat: 'daily',
  });
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.reminder.repeat).toBe('daily');
});
```

- [ ] **Step 2: Implement CreateReminderEntry change**

Replace `repeatEnabled: boolean` with `repeat: ReminderRepeat` (update call sites in reminders UI to pass `repeatEnabled ? 'yearly' : 'once'`).

- [ ] **Step 3: Add port types + register/get in `onboardingCoordinationPorts.ts`**

Mirror settings port pattern (`registerOnboardingActivationPort` / `getOnboardingActivationPort`).

- [ ] **Step 4: Wire in `appComposition.ts`**

Implementation sketch:

```ts
registerOnboardingActivationPort({
  createPetFromDraft: async ({ userId, pet }) => {
    const profile = petsComposition.createPetProfile.execute({
      userId,
      name: pet.nickname.trim(),
      type: pet.species === 'cat' ? 'cat' : 'dog',
      // map ageBand → approx dob optional; omit if uncertain
    });
    if (!profile.ok) return { ok: false, errorMessage: profile.errorMessage };
    await petsComposition.createPet.execute(userId, profile.pet);
    return { ok: true, petId: profile.pet.id };
  },
  createReminderFromDraft: async ({ petId, reminder }) => {
    const entry = remindersComposition.createReminderEntry.execute({
      petId,
      title: reminder.title,
      type: reminder.reminderType,
      date: reminder.date,
      time: reminder.time,
      repeat: reminder.repeat,
    });
    if (!entry.ok) return { ok: false, errorMessage: entry.errorMessage };
    await remindersComposition.createReminder.execute(entry.reminder);
    return { ok: true };
  },
});
```

Use the real composition export names in this repo (`petComposition` / `remindersComposition` — verify while implementing). After create, invalidate home dashboard if a refresh port exists.

Reject `pet.species === 'both'` at port boundary with a clear error (activation UI will not offer it).

- [ ] **Step 5: Run reminder + port-related tests — PASS; commit**

```bash
git commit -m "feat(onboarding): add activation port and daily reminder entry support"
```

---

### Task 4: Draft store hydrate + `persistFirstWin`

**Files:**
- Modify: `src/modules/app/store/onboardingDraftStore.ts`
- Modify: `src/modules/app/data/onboarding/OnboardingDraftDataSource.ts` (or equivalent path under `data/`)
- Test: `src/modules/app/store/__tests__/onboardingDraftStore.test.ts`

**Interfaces:**
- Produces: `persistFirstWin(): Promise<{ ok: true } | { ok: false; errorMessage: string }>`
- Consumes: `getOnboardingActivationPort()`, auth user id from a small getter passed in or read via existing session pattern used elsewhere in app store (prefer injecting userId argument from UI to keep store free of auth store import if that violates boundaries — if store already imports auth, match existing pattern)

- [ ] **Step 1: Failing store tests**

Cases:
1. `hydrate` resets legacy quiz draft to welcome default.
2. `persistFirstWin` calls pet then reminder; sets `createdPetId`; on reminder fail keeps `createdPetId` and returns error.
3. Retry with existing `createdPetId` skips pet create.

- [ ] **Step 2: Implement hydrate via `normalizeOnboardingDraft`**

- [ ] **Step 3: Implement `persistFirstWin`**

```ts
persistFirstWin: async (userId: string) => {
  const draft = get().draft;
  if (!draft.petDraft || !draft.reminderDraft) {
    return { ok: false, errorMessage: 'Add your pet and a reminder first.' };
  }
  const port = getOnboardingActivationPort();
  let petId = draft.createdPetId;
  if (!petId) {
    const petResult = await port.createPetFromDraft({
      userId,
      pet: draft.petDraft,
    });
    if (!petResult.ok) {
      void trackEvent('onboarding_persist_failed', { stage: 'pet' });
      return petResult;
    }
    petId = petResult.petId;
    get().update(d => ({ ...d, createdPetId: petId }));
  }
  const rem = await port.createReminderFromDraft({
    petId,
    reminder: draft.reminderDraft,
  });
  if (!rem.ok) {
    void trackEvent('onboarding_persist_failed', { stage: 'reminder' });
    return rem;
  }
  void trackEvent('onboarding_first_win_created', {
    reminder_kind: draft.reminderDraft.kind,
    species: draft.petDraft.species,
  });
  get().setPhase('paywall');
  return { ok: true };
},
```

Also add `startActivation()` → phase `activate`, step 0; and when reminder step completes → if authenticated go `persist` else leave ready for auth gate (set phase `activate` with step 1 complete — gate uses `activationReady`).

Define helper:

```ts
export function isActivationReady(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.petDraft?.nickname.trim() &&
      (draft.petDraft.species === 'dog' || draft.petDraft.species === 'cat') &&
      draft.reminderDraft?.title.trim() &&
      draft.reminderDraft.date &&
      draft.reminderDraft.time,
  );
}
```

- [ ] **Step 4: Tests PASS; commit**

```bash
git commit -m "feat(onboarding): persist first win via activation port"
```

---

### Task 5: Welcome screen (Pawly-inspired + Sign in)

**Files:**
- Create: `src/modules/app/ui/onboarding/OnboardingWelcomeScreen.tsx`
- Modify: `src/shared/assets/images/index.ts` only if exporting a dedicated hero (prefer existing `images.petHd1` + `images.appIcon`)

**Interfaces:**
- Consumes: `useOnboardingDraftStore().setPhase` / `startActivation`
- Produces: UI with Get Started + I already have an account

- [ ] **Step 1: Implement welcome screen**

Layout (tokens only):
- `colors.backgroundAlt` canvas
- Optional faint paws via existing `OnboardingBlobBackdrop` at low opacity
- Top: `Image` `images.appIcon` + “Pawsoul” (`colors.text.heading`)
- Hero: `images.petHd1` (dominant)
- Headline: “Care for all your pets in one place”
- Sub: short benefit line
- Cost line: “About 2 minutes · your pet’s name and one reminder”
- Primary: dark pill (`colors.text.heading` fill, `colors.text.inverse` label) “Get Started” + accent circular chevron (`colors.accent`)
- Secondary text button: “I already have an account”

Behavior:
- Get Started → `startActivation()` + track `onboarding_welcome_viewed` on mount + `onboarding_activation_started` on CTA
- Sign in → track `onboarding_sign_in_tapped`; set a draft flag or phase that RootNavigator maps to Auth without requiring activationReady (e.g. `setPhase('welcome')` and navigate by setting `commitmentAccepted`-replacement: add `wantsSignIn: true` on draft OR call auth by setting phase to a dedicated path). **Simplest:** set `phase` to `'activate'` with empty drafts is wrong. Prefer: store `entryIntent: 'sign_in' | 'activate' | null`. Gate: if `entryIntent === 'sign_in'` && !authenticated → `'auth'`; after auth, RootNavigator treats returning users via `hasPets` / `onboardingCompleted`.

Add to draft:

```ts
entryIntent: 'activate' | 'sign_in' | null;
```

Gate addition: if `entryIntent === 'sign_in' && !isAuthenticated` → `auth`. After successful auth, clear intent; if hasPets or onboardingCompleted → complete; else `startActivation()` (empty account).

- [ ] **Step 2: Manual visual check light/dark (or snapshot not required)**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(onboarding): add Pawly-inspired welcome with sign-in"
```

---

### Task 6: Activation shell + FirstReminderStep + PetBasics dog/cat

**Files:**
- Create: `src/modules/app/ui/onboarding/OnboardingActivationScreen.tsx`
- Create: `src/modules/app/ui/onboarding/steps/FirstReminderStep.tsx`
- Modify: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx`
- Reuse chrome patterns from `OnboardingFunnelScreen.tsx` (progress, back, CTA)

- [ ] **Step 1: Restrict PetBasicsStep species options to dog/cat** (remove `both`)

- [ ] **Step 2: FirstReminderStep**

Four `ScalePressable` cards: Walk, Vaccine, Medication, Checkup. On select, `onChange(buildReminderDraftDefaults(kind, nickname, new Date()))`. Show read-only summary of date/time (editable later in app — out of scope to build full picker unless trivial with existing DateTimePicker). CTA: Continue.

On Continue from reminder step:
1. `void requestNotificationPermission()` (do not block on false)
2. Mark activation ready (draft already has reminder)
3. If authenticated → `setPhase('persist')` else leave for auth gate (`entryIntent` null; `activationReady` true)

Track `onboarding_activation_step_viewed` with `{ step: 1|2, total_steps: 2 }`.

- [ ] **Step 3: Activation screen shell**

Steps 0–1 only; progress “Step X of 2”; back preserves draft; primary CTA labels: “Continue” / “Save & continue”.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(onboarding): activation steps for pet and first reminder"
```

---

### Task 7: Persist screen + navigator + RootNavigator wiring

**Files:**
- Create: `src/modules/app/ui/onboarding/OnboardingPersistScreen.tsx`
- Modify: `src/app/navigation/OnboardingNavigator.tsx`
- Modify: `src/app/navigation/RootNavigator.tsx`

- [ ] **Step 1: Persist screen**

On mount / Retry: call `persistFirstWin(userId)`. Show spinner + “Saving {name}’s reminder…”. On failure: error text + Retry button. No fake multi-line labor theater. On success: store already set phase `paywall`.

- [ ] **Step 2: OnboardingNavigator**

```tsx
switch (phase) {
  case 'welcome': return <OnboardingWelcomeScreen />;
  case 'activate': return <OnboardingActivationScreen />;
  case 'persist': return <OnboardingPersistScreen />;
  case 'paywall': return <OnboardingPaywallHost />;
  default: return <OnboardingWelcomeScreen />;
}
```

Remove tips branch from navigator.

- [ ] **Step 3: RootNavigator**

Pass new gate inputs (`hasPets: pets.length > 0`, `activationReady: isActivationReady(draft)`, `firstWinPersisted: Boolean(draft.createdPetId) && draft.phase !== 'activate' && draft.phase !== 'welcome'` — refine to `createdPetId != null` after successful persist only).

Render:
- `welcome` | `activate` | `persist` | `paywall` → `OnboardingNavigator`
- `auth` → `AuthNavigator`
- `complete` → existing pet gate / app

Remove old `quiz` / `tips` branches.

After auth: if `entryIntent === 'sign_in'` and pets exist → ensure settings onboardingCompleted stays true for returning users; if empty → `startActivation()`.

- [ ] **Step 4: Smoke unit test for gate wiring helper if extracted; commit**

```bash
git commit -m "feat(onboarding): wire activation navigator and persist screen"
```

---

### Task 8: Auth continuity + paywall after win + profile version

**Files:**
- Modify: `src/modules/auth/ui/screens/LoginScreen.tsx`
- Modify: `src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx`
- Modify: `src/modules/app/domain/onboarding/onboardingPaywallCopy.ts`
- Modify: `src/modules/app/domain/onboarding/OnboardingProfile.ts`
- Modify: `src/modules/app/domain/onboarding/buildOnboardingProfile.ts`
- Modify: `src/modules/app/store/onboardingDraftStore.ts` (`completeFunnel` → phase `done`, no tips)

- [ ] **Step 1: LoginScreen copy**

- If `isActivationReady(draft)`: title `Save {nickname}'s reminder`, subtitle about keeping their first reminder.
- If `entryIntent === 'sign_in'`: normal welcome-back sign-in (no quiz continuity).
- Remove dependence on `commitmentAccepted` for continuity.

Track `onboarding_auth_viewed` when shown from activation.

- [ ] **Step 2: Paywall host**

- Only reachable when `createdPetId` set.
- On skip/purchase/entitled: `setPhase('done')` then `completeFunnel()` (persist profile + `onboardingCompleted: true` + clear draft).
- Do not navigate to tips.
- Headline/CTA: value-oriented; stop using `buildOnboardingLossLine` as default (keep function unused or delete call sites). Use nickname: “Keep {name}’s care on track”.

- [ ] **Step 3: Profile version**

```ts
export const ONBOARDING_QUIZ_VERSION = 'activation_v1_2026-08';
```

`buildOnboardingProfile`: allow empty problems/goal; `committedAt` → use `completedAt` or persist timestamp; pet from `petDraft`.

- [ ] **Step 4: Update copy/profile unit tests; commit**

```bash
git commit -m "feat(onboarding): auth continuity, value paywall, activation profile version"
```

---

### Task 9: Analytics pass + PetRequired safety + final verification

**Files:**
- Touch event sites from Tasks 5–8 if any missing
- Modify: `RootNavigator` pet gate — users who just persisted have pets loaded; ensure `loadPets` runs after persist (call pet store load from activation port success path or PersistScreen after success)

- [ ] **Step 1: Confirm events fire**

| Event | Where |
|-------|--------|
| `onboarding_welcome_viewed` | Welcome mount |
| `onboarding_sign_in_tapped` | Welcome secondary |
| `onboarding_activation_step_viewed` | Activation steps |
| `onboarding_auth_viewed` | Login from activation |
| `onboarding_first_win_created` | persist success |
| `onboarding_persist_failed` | persist error |
| `paywall_viewed` / `paywall_dismissed` | existing host |
| `onboarding_completed` | completeFunnel |

- [ ] **Step 2: After persist success, refresh pets list** so `petGateActive` is false

- [ ] **Step 3: Run**

```bash
yarn test -- src/modules/app/domain/onboarding
yarn test -- src/modules/app/store
yarn test -- src/modules/reminders/domain/usecases
npx tsc --noEmit
```

- [ ] **Step 4: Manual checklist**

1. Fresh install → Welcome → pet → reminder → auth → persist → paywall Skip → Home with pet + reminder  
2. Welcome → Sign in (account with pets) → Home, no activation  
3. Sign in empty account → activation from pet step  
4. Kill app mid-activate → resume  
5. Deny notifications → still persists  
6. Entitled user → auto-skip paywall  

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(onboarding): analytics and post-persist pet refresh for activation path"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| First win = pet + reminder | 3, 4, 7 |
| Almost no quiz | 5, 6, 7 |
| Welcome Pawly + Sign in | 5 |
| Returning customers | 2, 5, 7 |
| Paywall after win + Skip + entitled | 8 |
| Auth after drafts | 2, 6, 8 |
| No tips / Home orients | 7, 8 |
| Ports / clean architecture | 3 |
| Daily walk / reminder defaults | 1, 3 |
| Legacy draft reset | 1, 4 |
| Anti-dark-pattern copy | 5, 8 |
| Analytics KPI | 4, 9 |
| Notification ask non-blocking | 6 |

**Out of scope (explicit):** deleting old quiz step files; Care+ price changes; `walk` ReminderType; full Add Pet form; gift-box paywall.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-08-23-onboarding-activation-first-win.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints  

Which approach?
