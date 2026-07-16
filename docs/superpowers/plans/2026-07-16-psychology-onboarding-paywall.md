# Psychology Onboarding → Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Flo-lite psychology onboarding funnel that ends in an onboarding paywall (Skip → free), then a short tip strip, using theme tokens and existing auth/subscription systems.

**Architecture:** Local `OnboardingDraft` (AsyncStorage via `storageService`) drives a step shell. `RootNavigator` gates phases: quiz → auth (if needed) → paywall → tips → `onboardingCompleted`. Reuse `PaywallScreen` with `source: 'onboarding'`. No pet creation in the quiz.

**Tech Stack:** React Native, TypeScript, Zustand (optional thin draft store), `storageService`, PostHog, existing `PaywallScreen` / `AuthNavigator` / settings store.

**Spec:** `docs/superpowers/specs/2026-07-16-psychology-onboarding-paywall-design.md`  
**Branch:** `feature/psychology-onboarding-paywall`

## Global Constraints

- Theme: `useTheme()` only — no hardcoded feature hex
- No `createPet` during quiz — lightweight `petDraft` only
- Paywall: hard with Skip → free; 14-day trial + INR catalog unchanged
- Auth order: quiz → commitment → auth (if guest) → paywall
- Tip strip is secondary after paywall/skip
- Clean Architecture: UI must not call repositories; settings via `useSettingsStore`
- Tests: `yarn test --watchman=false <path>`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/modules/app/domain/onboarding/OnboardingDraft.ts` | Types + defaults |
| `src/modules/app/domain/onboarding/onboardingDraftReducers.ts` | Pure step/draft updates |
| `src/modules/app/domain/onboarding/buildCarePlanSummary.ts` | Plan reveal copy from draft |
| `src/modules/app/data/onboarding/OnboardingDraftDataSource.ts` | Persist/load/clear draft |
| `src/modules/app/store/onboardingDraftStore.ts` | Zustand facade for draft + phase |
| `src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx` | Step shell + progress |
| `src/modules/app/ui/onboarding/steps/*.tsx` | Individual quiz steps |
| `src/modules/app/ui/onboarding/tips/OnboardingTipsScreen.tsx` | Post-paywall tips |
| `src/app/navigation/OnboardingNavigator.tsx` | Quiz + tips routes |
| `src/app/navigation/RootNavigator.tsx` | Phase gating |
| `src/app/navigation/types.ts` | `Paywall` source + onboarding params |
| `src/modules/subscription/ui/screens/PaywallScreen.tsx` | Onboarding skip / personalization |

---

### Task 1: Onboarding draft domain + persistence

**Files:**
- Create: `src/modules/app/domain/onboarding/OnboardingDraft.ts`
- Create: `src/modules/app/domain/onboarding/onboardingDraftReducers.ts`
- Create: `src/modules/app/data/onboarding/OnboardingDraftDataSource.ts`
- Create: `src/modules/app/domain/onboarding/__tests__/onboardingDraftReducers.test.ts`
- Create: `src/modules/app/data/onboarding/__tests__/OnboardingDraftDataSource.test.ts`

**Interfaces:**
- Produces: `OnboardingDraft`, `createDefaultOnboardingDraft()`, `advanceStep`, `setProblems`, `setPetDraft`, `setGoal`, `setCareInterests`, `acceptCommitment`, `setPhase`, `OnboardingDraftDataSource`

- [ ] **Step 1: Write reducer tests (failing)**

```typescript
import {
  advanceStep,
  createDefaultOnboardingDraft,
  setProblems,
  acceptCommitment,
  setPhase,
} from '../onboardingDraftReducers';

describe('onboardingDraftReducers', () => {
  it('starts at step 0 quiz phase', () => {
    const d = createDefaultOnboardingDraft();
    expect(d.step).toBe(0);
    expect(d.phase).toBe('quiz');
    expect(d.commitmentAccepted).toBe(false);
  });

  it('advanceStep increments within quiz bounds', () => {
    const d = advanceStep(createDefaultOnboardingDraft());
    expect(d.step).toBe(1);
  });

  it('setProblems replaces problems array immutably', () => {
    const base = createDefaultOnboardingDraft();
    const next = setProblems(base, ['missed_vaccines', 'no_records']);
    expect(next.problems).toEqual(['missed_vaccines', 'no_records']);
    expect(base.problems).toEqual([]);
  });

  it('acceptCommitment sets flag', () => {
    expect(acceptCommitment(createDefaultOnboardingDraft()).commitmentAccepted).toBe(
      true,
    );
  });

  it('setPhase updates phase', () => {
    expect(setPhase(createDefaultOnboardingDraft(), 'paywall').phase).toBe(
      'paywall',
    );
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn test --watchman=false src/modules/app/domain/onboarding/__tests__/onboardingDraftReducers.test.ts`

- [ ] **Step 3: Implement types + reducers**

`OnboardingDraft.ts`:

```typescript
import type { CareInterest } from '../../../settings/domain/models/Settings';

export type OnboardingProblem =
  | 'missed_vaccines'
  | 'no_records'
  | 'chaotic_routine'
  | 'vet_bill_surprises';

export type OnboardingGoal =
  | 'never_miss_care'
  | 'health_history'
  | 'multi_pet_calm';

export type PetDraft = {
  species: 'dog' | 'cat' | 'both';
  ageBand: 'puppy_kitten' | 'adult' | 'senior';
  nickname: string;
};

export type OnboardingPhase = 'quiz' | 'paywall' | 'tips' | 'done';

/** Quiz UI steps 0..7 (trust → commitment). Auth/paywall/tips are phases. */
export const QUIZ_STEP_COUNT = 8;

export type OnboardingDraft = {
  step: number;
  problems: OnboardingProblem[];
  petDraft: PetDraft | null;
  goal: OnboardingGoal | null;
  careInterests: CareInterest[];
  commitmentAccepted: boolean;
  phase: OnboardingPhase;
  skippedPaywall: boolean;
};
```

Implement pure immutable reducers in `onboardingDraftReducers.ts` matching tests (`advanceStep` clamps to `QUIZ_STEP_COUNT - 1`).

- [ ] **Step 4: Write data source tests + implement**

Mock `storageService` like settings tests. Key: `onboarding_draft`.

```typescript
// getDraft → default when null
// saveDraft round-trip
// clearDraft removes key
```

- [ ] **Step 5: Pass all Task 1 tests + commit**

```bash
yarn test --watchman=false src/modules/app/domain/onboarding/__tests__/onboardingDraftReducers.test.ts src/modules/app/data/onboarding/__tests__/OnboardingDraftDataSource.test.ts
git add src/modules/app/domain/onboarding src/modules/app/data/onboarding
git commit -m "$(cat <<'EOF'
feat(onboarding): add draft model and persistence

Support resumable psychology-funnel state with pure reducers.
EOF
)"
```

---

### Task 2: Care plan summary builder

**Files:**
- Create: `src/modules/app/domain/onboarding/buildCarePlanSummary.ts`
- Create: `src/modules/app/domain/onboarding/__tests__/buildCarePlanSummary.test.ts`

**Interfaces:**
- Consumes: `OnboardingDraft`
- Produces: `buildCarePlanSummary(draft) => { title, bullets: string[], tip: string, paywallHeadline: string }`

- [ ] **Step 1: Failing tests**

```typescript
import { buildCarePlanSummary } from '../buildCarePlanSummary';
import { createDefaultOnboardingDraft, setPetDraft, setGoal, setProblems, setCareInterests } from '../onboardingDraftReducers';

it('uses nickname in title and paywall headline', () => {
  let d = createDefaultOnboardingDraft();
  d = setPetDraft(d, { species: 'dog', ageBand: 'adult', nickname: 'Luna' });
  d = setGoal(d, 'never_miss_care');
  d = setProblems(d, ['missed_vaccines']);
  d = setCareInterests(d, ['vaccines', 'walks']);
  const s = buildCarePlanSummary(d);
  expect(s.title).toMatch(/Luna/);
  expect(s.paywallHeadline).toMatch(/Luna/);
  expect(s.bullets.length).toBeGreaterThan(0);
  expect(s.tip.length).toBeGreaterThan(0);
});

it('falls back when nickname missing', () => {
  const s = buildCarePlanSummary(createDefaultOnboardingDraft());
  expect(s.title).toMatch(/your pet/i);
});
```

- [ ] **Step 2: Implement mapping tables** (problem → focus line, goal → outcome line, careInterests → reminder line). Keep copy India-friendly, calm, not fear-mongering.

- [ ] **Step 3: Tests pass + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(onboarding): add personalized care plan summary builder

Bridge quiz answers into plan reveal and paywall headline copy.
EOF
)"
```

---

### Task 3: Draft store (Zustand)

**Files:**
- Create: `src/modules/app/store/onboardingDraftStore.ts`
- Create: `src/modules/app/store/__tests__/onboardingDraftStore.test.ts` (optional light test with mocked data source)

**Interfaces:**
- Produces: `useOnboardingDraftStore` with `draft`, `hydrate()`, `save()`, `update(reducer)`, `goNext()`, `goBack()`, `setPhase()`, `completeFunnel()`, `clear()`

- [ ] **Step 1: Implement store**

Pattern like `settingsStore`: hydrate on app boot from data source; every mutation persists.

```typescript
goNext: () => {
  const next = advanceStep(get().draft);
  set({ draft: next });
  void dataSource.saveDraft(next);
}
```

`completeFunnel`: set phase `done`, merge `careInterests` into settings via `useSettingsStore.getState().updateSettings`, set `onboardingCompleted: true`, clear draft.

- [ ] **Step 2: Hydrate from `RootNavigator` or app bootstrap** alongside `loadSettings` (find existing settings load site — typically splash/root — call `hydrate()` there).

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(onboarding): add onboarding draft zustand store

Persist funnel progress and complete into settings on exit.
EOF
)"
```

---

### Task 4: Quiz step UI + funnel shell

**Files:**
- Create: `src/modules/app/ui/onboarding/OnboardingFunnelScreen.tsx`
- Create: `src/modules/app/ui/onboarding/steps/TrustOpenStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/ProblemNamingStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/GoalStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/CareFocusStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/ProcessingStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/PlanRevealStep.tsx`
- Create: `src/modules/app/ui/onboarding/steps/CommitmentStep.tsx`
- Modify: `src/app/navigation/OnboardingNavigator.tsx` to mount funnel as primary

**Interfaces:**
- Consumes: `useOnboardingDraftStore`, `buildCarePlanSummary`, `toggleCareInterest` (existing), `useTheme`, PostHog

- [ ] **Step 1: Build `OnboardingFunnelScreen`**

- Progress: `(step + 1) / QUIZ_STEP_COUNT`
- Switch render by `draft.step` (0–7)
- Primary CTA: Continue / Next / “Show my plan” / “I’m ready”
- Disable Next until step validation (e.g. ≥1 problem; nickname non-empty; goal set; ≥1 care interest; commitment on step 7)
- On Continue from step 7 (commitment): `acceptCommitment()` + `setPhase('paywall')` — **do not** set `onboardingCompleted` yet
- Capture `onboarding_step_viewed` on step change; `onboarding_problem_selected` when leaving problems; `onboarding_plan_revealed` on step 6; `onboarding_commitment_completed` on accept
- Fade with RN `Animated` on step change (same pattern as current onboarding)

- [ ] **Step 2: Implement each step with tokens**

Use `Pressable` chips/cards; selected = `colors.accent` + `brandTint*`.  
Processing step: auto-advance after ~2s via `useEffect` + `goNext()`.

- [ ] **Step 3: Point `OnboardingNavigator` at funnel**

Keep old `OnboardingScreen` file temporarily unused or delete only after tips reuse any needed assets — prefer leave file but stop routing to it.

- [ ] **Step 4: Lint + commit**

```bash
yarn eslint src/modules/app/ui/onboarding src/app/navigation/OnboardingNavigator.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): add psychology quiz funnel UI

Interactive problem-to-commitment steps with plan reveal theater.
EOF
)"
```

---

### Task 5: RootNavigator phase gating + auth handoff

**Files:**
- Modify: `src/app/navigation/RootNavigator.tsx`
- Modify: `src/app/navigation/types.ts` (if needed for onboarding stack)
- Modify: `src/app/navigation/OnboardingNavigator.tsx` (Funnel + Tips screens)

**Interfaces:**
- Consumes: `draft.phase`, `draft.commitmentAccepted`, `isAuthenticated`, `settings.onboardingCompleted`

- [ ] **Step 1: Define gate helper** (pure, tested)

Create `src/modules/app/domain/onboarding/resolveOnboardingGate.ts`:

```typescript
export type OnboardingGate =
  | 'quiz'
  | 'auth'
  | 'paywall'
  | 'tips'
  | 'complete';

export function resolveOnboardingGate(input: {
  onboardingCompleted: boolean;
  phase: OnboardingPhase;
  commitmentAccepted: boolean;
  isAuthenticated: boolean;
}): OnboardingGate {
  if (input.onboardingCompleted || input.phase === 'done') return 'complete';
  if (input.phase === 'tips') return 'tips';
  if (input.phase === 'paywall') {
    if (!input.isAuthenticated) return 'auth';
    return 'paywall';
  }
  // quiz phase
  if (input.commitmentAccepted && !input.isAuthenticated) return 'auth';
  if (input.commitmentAccepted && input.isAuthenticated) return 'paywall';
  return 'quiz';
}
```

Unit test all branches.

- [ ] **Step 2: Wire RootNavigator**

Replace naive `!hasCompletedOnboarding → OnboardingNavigator` with gate:

| Gate | Content |
|------|---------|
| `quiz` | OnboardingNavigator (Funnel) |
| `auth` | AuthNavigator |
| `paywall` | Dedicated paywall host **or** OnboardingNavigator screen `OnboardingPaywall` wrapping `PaywallScreen` |
| `tips` | OnboardingNavigator tips |
| `complete` | existing pet/app/auth logic |

**Auth return path:** After successful login while `commitmentAccepted && phase!==done`, set `phase: 'paywall'` (if not already) so next render shows paywall — not tip strip.

**Important:** While `!onboardingCompleted`, do **not** fall through to main App even if authenticated.

- [ ] **Step 3: Manual logic check + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(onboarding): gate root navigation by funnel phase

Route quiz, auth, paywall, and tips in the correct psychology order.
EOF
)"
```

---

### Task 6: Onboarding paywall + skip → tips

**Files:**
- Modify: `src/app/navigation/types.ts` — `PaywallRouteParams.source?: 'pet_limit' | 'settings' | 'onboarding'`
- Modify: `src/modules/subscription/ui/screens/PaywallScreen.tsx`
- Create: `src/modules/app/ui/onboarding/OnboardingPaywallHost.tsx` (optional thin wrapper)

- [ ] **Step 1: Extend source type** everywhere `PaywallRouteParams` is referenced.

- [ ] **Step 2: Onboarding behavior in PaywallScreen**

When `source === 'onboarding'`:
- Headline: prefer `buildCarePlanSummary(draft).paywallHeadline` if draft hydrated
- Back / Skip: `posthog.capture('paywall_dismissed', { source: 'onboarding' })`, set `skippedPaywall: true`, `setPhase('tips')` — **do not** `goBack()` into a dead stack
- After successful checkout (existing success path if any): `setPhase('tips')` instead of only `goBack()`
- Keep annual default / trial copy as today

If current Paywall only `goBack()` on close, add optional callback prop **or** read `useOnboardingDraftStore` when source is onboarding (acceptable for composition root UI).

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(subscription): support onboarding paywall skip into tips

Personalize headline and continue funnel after dismiss or purchase.
EOF
)"
```

---

### Task 7: Tip strip + funnel completion

**Files:**
- Create: `src/modules/app/ui/onboarding/tips/OnboardingTipsScreen.tsx`
- Modify: Onboarding navigator routes

- [ ] **Step 1: Tips UI (1–2 screens)**

Short “how Pawfect works” (reminders / records) — light reuse of existing imagery/copy, not full old 3-step tour. CTA: “Continue to Pawfect”.

- [ ] **Step 2: Complete**

On final CTA: call store `completeFunnel()` → settings `onboardingCompleted: true`, phase `done`, clear draft, fire `onboarding_completed` with `{ skipped_paywall, care_interests }`.

RootNavigator then shows PetRequired or App.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(onboarding): add post-paywall tips and funnel completion

Orient users after monetization moment then enter pet gate.
EOF
)"
```

---

### Task 8: Verification checklist

- [ ] **Unit:** all new `__tests__` green with `--watchman=false`
- [ ] **Guest path:** quiz → commitment → login → paywall → skip → tips → PetRequired
- [ ] **Authed path:** quiz → commitment → paywall (no login) → subscribe or skip → tips
- [ ] **Resume:** kill app mid-quiz; reopen at same step
- [ ] **Legacy:** existing `onboardingCompleted: true` never sees funnel
- [ ] **Dark/light:** chips and paywall readable
- [ ] **Analytics:** confirm events in PostHog debug / console in `__DEV__`
- [ ] **Final commit** only if polish needed

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Draft + resume | 1, 3 |
| Plan reveal copy | 2, 4 |
| Quiz steps 1–8 | 4 |
| Auth before paywall | 5 |
| Paywall + Skip | 6 |
| Tip strip | 7 |
| Complete + settings | 3, 7 |
| Analytics | 4, 6, 7 |
| No createPet | Global |
| Theme tokens | 4, 6, 7 |

## Placeholder scan

No TBD implementation steps. Gift-box paywall explicitly out of scope.
