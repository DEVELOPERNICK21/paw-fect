# Onboarding Psychology Upgrade Implementation Plan

> **For agentic workers:** Use executing-plans or implement task-by-task. Spec source: user message 2026-08-10 PawSoul Onboarding Upgrade.

**Goal:** Close psychology gaps in the existing 8-step quiz → auth → paywall → tips flow without changing funnel shape or gate routing.

**Architecture:** Persist `OnboardingProfile` on `Settings` at `completeFunnel`; layer copy/validation/paywall personalization that reads profile with graceful fallbacks.

**Tech Stack:** React Native, Zustand settings + onboarding draft stores, existing `trackEvent` facade.

**Spec constraints:** Do NOT change quiz step count/order, commitment mechanic, Skip/entitled-auto-skip, or `resolveOnboardingGate` core routing. No fabricated stats.

## Codebase name map

| Spec name | Actual |
|-----------|--------|
| `careFocus` | `careInterests: CareInterest[]` |
| `pet` | `petDraft: PetDraft \| null` |
| problems | `OnboardingProblem` union (`missed_vaccines`, `no_records`, `chaotic_routine`, `vet_bill_surprises`) — **not** `missed_vet_visits` / `forget_medication` |
| goals | `never_miss_care` \| `health_history` \| `multi_pet_calm` — **not** `weight_management` |
| durable store | `Settings` via `useSettingsStore` / `SettingsLocalDataSource` |
| complete write | `useOnboardingDraftStore.completeFunnel` |
| auth UI | `LoginScreen` (shown for onboarding `auth` gate) |
| paywall | `PaywallScreen` + `OnboardingPaywallHost` |

## File map

| File | Change |
|------|--------|
| `src/modules/settings/domain/models/Settings.ts` (+ new `OnboardingProfile.ts`) | Add optional `onboardingProfile` |
| `SettingsLocalDataSource` + tests | Default/migration: profile undefined OK |
| `onboardingDraftStore.completeFunnel` + tests | Build + persist profile before clear draft; track `onboarding_draft_persisted` |
| `ProcessingStep.tsx` | Rotating lines; species fallback; qualitative social proof |
| `LoginScreen.tsx` | Continuity copy when entered from onboarding (detect via draft phase/commitment) |
| `ProblemNamingStep` / `CareFocusStep` (+ funnel) | Validation microcopy + `onboarding_validation_shown` |
| `PaywallScreen` + host | Onboarding variant: loss line, social proof, feature reorder, CTA; events |
| `OnboardingTipsScreen` | Nickname interpolate |
| Home empty / AddPet | Prefill + banner |
| Domain helpers | `buildOnboardingProfile`, `onboardingValidationCopy`, `onboardingPaywallCopy` |

## Tasks

1. Persist `OnboardingProfile` (foundational)
2. Processing screen labor + social proof
3. Auth continuity copy
4. Validation microcopy steps 2 & 5
5. Post-onboarding personalization (tips, home, AddPet prefill)
6. Onboarding paywall variant (includes loss-aversion §5)

## Loss-aversion mapping (real problem tags)

Use actual tags only; qualitative lines only (no invented 3x stats):

- `missed_vaccines` → reminders slip copy for vaccines
- `chaotic_routine` / `no_records` / `vet_bill_surprises` → matching qualitative stakes
- Default: “Most pet parents who skip a plan lose momentum within the first two weeks.”
