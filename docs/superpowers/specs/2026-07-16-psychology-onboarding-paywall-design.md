# Psychology Onboarding → Paywall Design

**Date:** 2026-07-16  
**Branch:** `feature/psychology-onboarding-paywall`  
**Status:** Approved for planning  

## Goal

Replace the primary feature-tour onboarding with a Flo/Cal AI–inspired psychology funnel that makes the user name a pet-care problem, invest through interactive answers, see a personalized care-plan reveal, commit, authenticate, then hit a hard paywall with Skip — so trial start feels like unlocking *their* plan, not buying an app.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Pattern | Flo-lite (~12 steps), not 40–70 Flo screens or Cal AI “no free tier” |
| Paywall | Hard with Skip → free tier (1 pet) |
| Auth placement | Quiz → plan → commitment → **auth** → paywall |
| Pet data | Lightweight draft only (species, age band, nickname) — no `createPet` |
| Feature tour | Secondary short tip strip **after** paywall/skip |
| Trial / pricing | Keep existing 14-day trial + INR Care+/Family catalog |

## Research basis (summary)

- Flo: long quiz + trust + commitment gesture before paywall; quiz sells, paywall unlocks.  
- Cal AI: investment quiz → projected outcome → hard paywall; sunk cost drives yes.  
- Highest-leverage bridge: **personalized plan reveal** between quiz and price.  
- Pawfect is anxiety + habit (closer to Flo trust than pure Cal AI hard lock); India freemium retained via Skip.

## Scope

**In**
- New primary onboarding step machine (~12 steps)
- Local onboarding draft persistence + resume
- Commitment screen
- Wire `PaywallScreen` with `source: 'onboarding'`
- RootNavigator phase gating (quiz → auth → paywall → tips → done)
- Short post-paywall tip strip (secondary)
- PostHog funnel events listed below
- Theme tokens only (`useTheme()`)

**Out**
- Creating a real pet during quiz
- Changing plan prices or trial length
- iOS StoreKit (existing gap)
- Remaking Settings paywall entry
- Full Flo-length 40+ screens

## Funnel UX

| # | Screen | Interaction | Psychology |
|---|--------|-------------|------------|
| 1 | Trust open | Brand + “for pet parents who worry they’ve missed something” | Safety |
| 2 | Problem naming | Multi-select pains (missed vaccines, no records, chaotic routine, vet-bill surprises) | Problem awareness |
| 3 | Pet basics | Species (dog/cat/both), age band, nickname | Personal stakes |
| 4 | Goal | Single-select outcome | Identity |
| 5 | Care focus | Multi-select Vaccines / Walks / Meds / Grooming | Preference + sunk cost |
| 6 | Processing theater | “Building {nickname}’s care plan…” (~2s) | Labor illusion |
| 7 | Plan reveal | Summary from answers + one concrete tip | Aha |
| 8 | Commitment | “I’m ready to stay on top of {nickname}’s health” | Intent |
| 9 | Auth | Sign-in / Google — “save your plan” | Account |
| 10 | Paywall | Care+ annual default, 14-day trial, weekly ₹; Skip → free | Monetize |
| 11 | Tip strip | 1–2 light “how Pawfect works” screens | Orient |
| 12 | Complete | `onboardingCompleted = true` → PetRequired / App | Exit |

### Copy / UX rules
- Lead with problem and outcome language, not feature lists, until tip strip.
- Validate selections briefly (“That’s common — we can help”) where it fits without bloating to 18 steps.
- Paywall headline should reference nickname/goal when available (personalization bridge).
- Skip is always visible on onboarding paywall; does not clear draft answers.

## Architecture

### Navigation phases

`RootNavigator` (conceptual):

```text
!bootstrapped → Splash
onboarding incomplete:
  phase quiz/commitment → OnboardingQuizNavigator
  needs auth (post-commitment, !isAuthenticated) → AuthNavigator (return to funnel)
  phase paywall → Paywall (source: onboarding)
  phase tips → OnboardingTipsNavigator
  else mark done
onboarding done + auth + no pets → PetRequired
onboarding done + auth + pets → App
else → Auth
```

Exact flag design (implementation may use one of):
- `settings.onboardingCompleted` + `settings.onboardingPhase`, or
- local `OnboardingDraft.phase` until completion

**Requirement:** cold start mid-quiz restores draft and step.

### Data model

Local draft (MMKV/Async via existing storage patterns):

```ts
type OnboardingProblem =
  | 'missed_vaccines'
  | 'no_records'
  | 'chaotic_routine'
  | 'vet_bill_surprises';

type OnboardingGoal =
  | 'never_miss_care'
  | 'health_history'
  | 'multi_pet_calm';

type PetDraft = {
  species: 'dog' | 'cat' | 'both';
  ageBand: 'puppy_kitten' | 'adult' | 'senior';
  nickname: string;
};

type OnboardingDraft = {
  step: number;
  problems: OnboardingProblem[];
  petDraft: PetDraft | null;
  goal: OnboardingGoal | null;
  careInterests: CareInterest[]; // existing type
  commitmentAccepted: boolean;
  phase: 'quiz' | 'paywall' | 'tips' | 'done';
};
```

On auth success: merge `careInterests` (+ optional draft fields) into `Settings` via existing `updateSettings`.  
On funnel complete (after tips): `onboardingCompleted: true`, clear or archive draft.  
**No** call to pet create use cases in this flow.

### Paywall integration
- Reuse `PaywallScreen`.
- Extend `PaywallRouteParams.source` with `'onboarding'`.
- Skip / back behavior: continue to tips; do not block free users.
- Subscribe success: continue to tips (then normal pet gate).

### Module layout (planned)

```text
src/modules/app/ui/onboarding/
  OnboardingFunnelScreen.tsx      # step shell / progress
  onboardingDraftStore.ts         # or settings-backed draft
  steps/
    TrustOpenStep.tsx
    ProblemNamingStep.tsx
    PetBasicsStep.tsx
    GoalStep.tsx
    CareFocusStep.tsx
    ProcessingStep.tsx
    PlanRevealStep.tsx
    CommitmentStep.tsx
  tips/
    OnboardingTipsScreen.tsx
```

Composition stays Clean Architecture: UI → store/use cases for settings; no store-to-store feature coupling.

## Analytics funnel

| Event | When |
|-------|------|
| `onboarding_step_viewed` | Each step (`step`, `total_steps`, `phase`) |
| `onboarding_problem_selected` | Problems confirmed |
| `onboarding_plan_revealed` | Plan reveal shown |
| `onboarding_commitment_completed` | Commitment accepted |
| `paywall_viewed` | `{ source: 'onboarding' }` |
| `paywall_dismissed` | Skip / back from onboarding paywall |
| `subscription_checkout_started` | Existing |
| `onboarding_completed` | Tips finished / funnel exit (`skipped_paywall`, `care_interests`) |

**Primary KPI:** install → trial start (onboarding paywall).  
**Secondary:** trial→paid, quiz completion rate, step drop-off, D1/D7 retention.

## Edge cases

- Resume draft after kill mid-quiz  
- Already authenticated at commitment → skip auth, go to paywall  
- Auth failure → stay on auth; draft kept  
- Checkout failure → stay on paywall; Skip available  
- Offline on paywall → message + Skip  
- Legacy `onboardingCompleted: true` → never enter new funnel  
- Back from paywall → commitment (avoid auth↔paywall loops)

## Testing

1. Unit: draft reducers / step transitions / care interest merge  
2. Persistence: resume after reload  
3. Navigation: guest path (auth then paywall) vs already-authed path  
4. Skip vs subscribe both reach tips then PetRequired/App  
5. Manual light + dark; paywall personalization string with nickname  

## Success criteria

- User can name a problem and reach a personalized plan before seeing price  
- Paywall appears only after commitment (+ auth when needed)  
- Skip still enters free product with tip orientation  
- Funnel events allow step-level drop-off analysis  
- No new hardcoded theme colors in feature UI  

## Non-goals / follow-ups

- Gift-box secondary paywall (Flo) — later experiment  
- Longer 16–18 step validation loops — v2  
- Hard lock with no Skip (Cal AI) — rejected for Pawfect freemium/India  
