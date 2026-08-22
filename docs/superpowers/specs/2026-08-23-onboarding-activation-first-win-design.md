# Onboarding Activation — First Win Design

**Date:** 2026-08-23  
**Status:** Approved for planning  
**Replaces as primary path:** Flo/Cal AI–style 8-step psychology quiz (`docs/superpowers/specs/2026-07-16-psychology-onboarding-paywall-design.md`)

## Goal

Optimize onboarding for **activation** (a real first win) and a light **habit loop**, not for sunk-cost conversion. New users leave with a named pet and one reminder already in the product; returning customers skip the funnel; paywall appears only after the win, with an honest Skip.

North star: **persuasive + behavioral design without dark patterns.** Pattern closest to Duolingo’s first lesson / Notion’s first page — product works before price.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| North star | First win (activation) + light habit (first reminder) |
| First win | Create real pet + first reminder before onboarding ends |
| Quiz length | Almost none — no problem/goal/processing/commitment quiz |
| Approach | Dedicated activation wizard (not Add Pet form dump, not ghost 8-step machine) |
| Paywall timing | After first win; Skip always visible; entitled auto-skip kept |
| Returning customers | Sign in from welcome → skip activation if pets or `onboardingCompleted` |
| Welcome visual | Pawly-inspired layout; **Pawsoul** branding; add Sign in (reference lacks it) |
| Auth placement | After pet + reminder draft, before persist |
| Tip strip | Removed — Home is orientation |
| Architecture | Clean Architecture ports for pet/reminder create; no store-to-store |

## Research / ethics framing

| Mode | How we use it |
|------|----------------|
| **Persuasive** | Time cost up front; easy → hard order; personalize with pet name; real aha (pet on Home) |
| **Behavioral** | First reminder schedules a reason to open tomorrow; notification ask in context |
| **Dark patterns** | Explicitly forbidden (see below) |

### Forbidden (dark patterns)

- Fake “building your plan” labor theater  
- Commitment / sunk-cost pledge before price  
- Hidden, guilt, or confirm-shame Skip  
- Fabricated stats or fake social proof  
- Forcing new-user quiz on returning customers  
- Paywall before anything real exists  
- Roach motel (back clears data; Sign in hard to find)

### Allowed

- Honest time estimate (~2 minutes)  
- Prefill reminder date/time  
- Name-personalized paywall value copy (not scare copy)  
- Resume draft on interrupt  
- Entitled users skip paywall automatically  

## Funnel UX

### Welcome

- Cream / `backgroundAlt` canvas; faint paw texture via tokens  
- Brand: Pawsoul mark + name  
- Dominant pet hero (owned asset or new licensed/owned art — not the reference stock)  
- Benefit headline + one supporting line  
- Cost: **About 2 minutes · your pet’s name and one reminder**  
- Primary CTA: dark pill **Get Started** + orange circular arrow (tokens: heading fill / accent)  
- Secondary: **I already have an account** → auth (no quiz)

### New user (Get Started)

| # | Screen | Interaction | Psychology |
|---|--------|-------------|------------|
| 1 | Pet | Name, dog/cat, age band (no photo required; no `both`) | Personal stakes |
| 2 | First reminder | Kind: walk / vaccination / medication / checkup; prefilled when | Habit seed |
| — | Notifications | Ask when continuing from reminder; decline OK | Context permission |
| 3 | Auth | “Save {name}’s reminder” — email or Google | Expensive ask last |
| 4 | Persist | Create pet + reminder for real; retry on failure | Real win, not theater |
| 5 | Paywall | Care+ / trial; Skip secondary; skip if entitled | Fair monetize |
| 6 | Done | `onboardingCompleted` → **Home** (pet + reminder present) | Activation |

Progress after welcome: **Step X of 2** (pet, reminder only). Auth / persist / paywall are gates, not quiz steps.

### Returning customer

| Situation | Result |
|-----------|--------|
| Sign in, has pets or `onboardingCompleted` | App / Home — no activation, no onboarding paywall |
| Sign in, empty account | `activate` from pet step (skip welcome) |
| Entitled at paywall gate | Auto-skip (existing host behavior) |

### Resume

Cold start mid-funnel restores last unfinished gate/step. Back preserves all draft fields.

### Reminder defaults

| Kind | Maps to `ReminderType` | Default when | Repeat |
|------|------------------------|--------------|--------|
| Daily walk | `other` (no walk type today) | Tomorrow 08:00 | daily |
| Vaccine | `vaccination` | ~4 weeks out, 09:00 | yearly |
| Medication | `medication` | Tomorrow 08:00 | once |
| Vet checkup | `checkup` | ~1 year out, 09:00 | yearly |

Title prefilled from kind + pet nickname (e.g. `{name}'s walk`).

## Architecture

### Gates

```text
welcome → activate → auth → persist → paywall → done → App
```

`resolveOnboardingGate` (or successor) must encode:

- Incomplete + no progress → `welcome`  
- Activate steps incomplete → `activate`  
- Draft ready + !authenticated → `auth`  
- Authenticated + not yet persisted → `persist`  
- Persisted + not entitled → `paywall`  
- Skip / purchase / entitled → complete → App  
- Authenticated returning with pets / completed → never enter welcome/activate  

PetRequired gate should not trap users who already created a pet in this funnel.

### Draft model (local)

Slim activation draft (names illustrative):

```ts
type ActivationReminderKind = 'walk' | 'vaccination' | 'medication' | 'checkup';

type ReminderDraft = {
  kind: ActivationReminderKind;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  /** walk → daily; vaccine/checkup → yearly; medication → once */
  repeat: 'once' | 'daily' | 'yearly';
};

type OnboardingDraft = {
  step: number; // 0 pet, 1 reminder within activate
  petDraft: PetDraft | null; // species: 'dog' | 'cat' only on this path
  reminderDraft: ReminderDraft | null;
  phase: 'welcome' | 'activate' | 'persist' | 'paywall' | 'done';
  // paywallOutcome, skippedPaywall retained for analytics / profile
};
```

**Legacy:** Mid-old-quiz drafts → reset to `welcome` on hydrate (do not half-resume Flo funnel).

**Removed from primary path:** problems, goal, careInterests as required quiz fields, commitment, tips phase. Profile persistence may keep optional/empty legacy fields for settings shape compatibility, or bump `quizVersion` to `activation_v1_2026-08`.

### Cross-feature port

App module must not import pets/reminders stores or repositories.

Extend coordination ports (same pattern as `OnboardingSettingsPort`):

```ts
// illustrative
interface OnboardingActivationPort {
  createPetFromDraft(input: { userId: string; pet: PetDraft }): Promise<{ ok: true; petId: string } | { ok: false; errorMessage: string }>;
  createReminderFromDraft(input: { petId: string; reminder: ReminderDraft }): Promise<{ ok: true } | { ok: false; errorMessage: string }>;
}
```

Registered in `appComposition`; implementations call pets/reminders use cases.

**Note:** `CreateReminderEntry` today only toggles once vs yearly. Walk (`daily`) must go through `CreateReminder` (or extend `CreateReminderEntry`) so activation can set `repeat: 'daily'`.

Persist failure → stay on persist + retry; do **not** set `onboardingCompleted`.

If pet succeeds and reminder fails, stash `createdPetId` on the draft and retry reminder only.

### UI layout

```text
src/modules/app/ui/onboarding/
  OnboardingWelcomeScreen.tsx          # new — Pawly-inspired + Sign in
  OnboardingActivationScreen.tsx       # shell for pet + reminder steps
  steps/
    PetBasicsStep.tsx                  # reuse; dog/cat only
    FirstReminderStep.tsx              # new
  OnboardingPaywallHost.tsx            # reuse; copy without scare loss lines
  OnboardingPersistStep.tsx            # new — real create + error/retry
```

Retire from primary navigator: ProblemNaming, Goal, CareFocus, Processing, PlanReveal, Commitment, Tips. Files may remain until a cleanup task deletes them.

### Auth continuity

Login when entered from activation: continuity copy (“Save {name}’s reminder”), not generic marketing.

## Paywall

- Source: `onboarding`  
- Timing: after successful persist only  
- Skip: always visible, secondary weight, no guilt modal  
- Copy: value + trial length + nickname when available; **no** old loss-aversion scare lines as default  
- Entitled: auto-skip to done  

## Analytics

| Event | When |
|-------|------|
| `onboarding_welcome_viewed` | Welcome shown |
| `onboarding_activation_step_viewed` | Pet / reminder step (`step`, `total_steps: 2`) |
| `onboarding_sign_in_tapped` | Welcome secondary CTA |
| `onboarding_auth_viewed` | Auth gate from activation |
| `onboarding_first_win_created` | Pet + reminder persist success |
| `onboarding_persist_failed` | Persist error (retry available) |
| `paywall_viewed` | `{ source: 'onboarding' }` |
| `paywall_dismissed` | Skip |
| `onboarding_completed` | Funnel exit (`skipped_paywall`, `paywall_outcome`) |

**Primary KPI:** install → first win created (pet + reminder).  
**Secondary:** trial start from onboarding paywall; quiz drop-offs retired as primary.

## Edge cases

- Resume after kill mid-activate / mid-auth / mid-persist  
- Auth failure → stay on auth; draft kept  
- Persist partial (pet OK, reminder fails) → keep petId on draft; retry reminder only; do not mark complete or show paywall until both succeed  
- Checkout failure → stay on paywall; Skip available  
- Offline persist → clear error + retry  
- Already authenticated at Get Started → skip auth gate; go activate → persist  
- Legacy `onboardingCompleted: true` → never enter new funnel  
- Notification denied → reminder still saved; no blocking  

## Testing

1. Unit: gate resolver, draft reducers, reminder default builders, legacy draft reset  
2. Port mocks: persist success/failure paths  
3. Navigation: guest path, returning with pets, empty signed-in, entitled auto-skip  
4. Skip vs subscribe both land on Home with pet present  
5. Manual: welcome light/dark; Sign in discoverability; Skip visibility  

## Success criteria

1. New user can create pet + reminder and reach Home without a psychology quiz  
2. Returning customer can Sign in from welcome and never see activation  
3. Paywall only after first win; Skip always visible; entitled auto-skip works  
4. No fake processing / commitment / fabricated social proof on the primary path  
5. Welcome matches visual contract (hero, cream, dark CTA + accent arrow, Sign in) using theme tokens  
6. Funnel events support first-win and paywall analysis  

## Out of scope

- Changing Care+ prices or trial length  
- Adding `walk` as a first-class `ReminderType` (map to `other` for v1)  
- Full Add Pet form / photo / breed in onboarding  
- Gift-box secondary paywall  
- Hard lock with no Skip  
- Rewriting Settings paywall entry  
- Deleting unused quiz step files in the same PR (optional follow-up cleanup)  

## Non-goals / follow-ups

- A/B welcome hero assets  
- Post-Home “streak” or habit coach  
- Longer optional personalization quiz after first win  
- Migrating old in-progress quiz drafts instead of reset  

## Relation to prior specs

| Spec | Status vs this design |
|------|------------------------|
| 2026-07-16 psychology onboarding paywall | Superseded as **primary** path |
| 2026-08-10 psychology upgrade | Superseded for quiz/paywall scare copy; entitled skip + profile ideas may inform profile version bump |
| 2026-08-10 visual restyle | Visual language (blob, accent, tokens) may reuse; flow constraints of that doc no longer bind |
