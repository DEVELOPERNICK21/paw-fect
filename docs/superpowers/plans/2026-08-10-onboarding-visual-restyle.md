# Onboarding Visual Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing 8-step psychology onboarding quiz to match Dribbble-inspired warmth and tactile interaction without changing flow or gates.

**Architecture:** Add shared onboarding UI primitives (`OnboardingBlobBackdrop`, `AccentHeadline`, pressable scale helper), restyle `OnboardingFunnelScreen` chrome (back, progress, CTA, step transition), then update each step’s presentation only.

**Tech Stack:** React Native `Animated` / `Pressable`, existing `useTheme` tokens, `react-native-svg` (already in app).

**Spec:** `docs/superpowers/specs/2026-08-10-onboarding-visual-restyle-design.md`

## Global Constraints

- No new onboarding phases, screens, or gate changes
- No hardcoded hex/spacing in feature UI — theme tokens only
- Keep analytics events and validation/business logic unchanged
- Dark mode must remain readable

## File map

| File | Responsibility |
|------|----------------|
| `src/modules/app/ui/onboarding/components/OnboardingBlobBackdrop.tsx` | Organic accent blob + paw marks |
| `src/modules/app/ui/onboarding/components/AccentHeadline.tsx` | Headline with accent spans |
| `src/modules/app/ui/onboarding/components/ScalePressable.tsx` | Tactile press scale wrapper |
| `OnboardingFunnelScreen.tsx` | Chrome + transitions + CTA |
| `steps/*.tsx` + `OnboardingCareInterestsStep.tsx` | Per-step visual restyle |

---

### Task 1: Shared primitives

- [ ] Create `OnboardingBlobBackdrop`, `AccentHeadline`, `ScalePressable`
- [ ] Commit

### Task 2: Funnel chrome

- [ ] Circular back, thicker progress, dark CTA, slide+fade on step change
- [ ] Commit

### Task 3: Hero steps (Trust, Plan, Commitment, Processing)

- [ ] Blob + accent headlines + tactile pledge / pulse
- [ ] Commit

### Task 4: Selection steps (Problem, Goal, Care, Pet basics)

- [ ] Larger cards/chips, ScalePressable, stronger selected states
- [ ] Commit

### Task 5: Verify

- [ ] `yarn eslint` on touched files; smoke that funnel logic unchanged
- [ ] Commit any fixes
