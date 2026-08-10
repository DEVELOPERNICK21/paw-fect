# Onboarding Visual Restyle (Dribbble-inspired)

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Inspiration:** [Fresh Meals for Happy Pets onboarding](https://dribbble.com/shots/27528654--Fresh-Meals-for-Happy-Pets-App-Onboarding-Screen) (visual language only)

## Goal

Make the **existing** psychology onboarding funnel feel warmer and more interactive by adopting the Dribbble shot’s visual language (cream canvas, orange organic blob / paws, accent words, solid dark CTAs, tactile selection, richer motion) — **without changing flow, gates, step count, or psychology structure.**

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Flow | Unchanged: 8-step quiz → auth → paywall → tips |
| New screens / pre-quiz carousel | **No** |
| Gate / draft / Skip / entitled logic | **No changes** |
| Scope of restyle | Quiz shell + quiz steps first; light CTA/accent alignment on tips only if cheap |
| Design tokens | Mandatory — map inspiration colors to existing theme tokens; no raw hex in feature UI |
| Dark mode | Required — blob/hero/CTA use semantic tokens that work in both themes |

## Token mapping (inspiration → Pawsoul)

| Inspiration | Token usage |
|-------------|-------------|
| Cream canvas | `colors.backgroundAlt` (shell already uses this) |
| Orange accent / blob | `colors.accent` / `colors.primary` + `brandTint*` fills |
| Accent headline words | `colors.accent` (or `primary`) on emphasized spans |
| Black CTA / circular controls | `colors.text.heading` fill + `colors.text.inverse` label (not literal `#000`) |
| Body copy | `colors.text.body` / `secondary` |
| Selected chips | Accent border/fill via `accent` + `brandTint*` |

If a missing semantic is needed (e.g. `onboardingHeroWash`), add it to `src/shared/theme/colors.ts` for light **and** dark — do not hardcode in screens.

## In scope

### Shared quiz chrome (`OnboardingFunnelScreen`)
- Circular back control (filled dark circle + chevron) instead of plain `←` text
- Progress bar: thicker track, accent fill, optional soft track using `brandTint*`
- Primary CTA: full-width, large radius, dark fill / inverse text (Dribbble “Get Started / Skip” energy mapped to Continue / Show my plan / I’m ready)
- Step transition: keep fade; add short horizontal slide or spring on step change (opacity + translateX)
- Optional light haptic on Continue / back (if app already uses haptics elsewhere; otherwise skip)

### Shared visual primitives (new small components under onboarding UI)
- `OnboardingBlobBackdrop` — organic orange shape + translucent paw marks (SVG or View layers); token-colored; reduced opacity in dark mode
- `AccentHeadline` — children with optional accent spans for 1–2 emphasized words
- Reuse across Trust / Plan reveal / Commitment (and optionally Processing)

### Per-step restyle (same steps, same validation rules)
| Step | Visual / interaction |
|------|----------------------|
| Trust open | Blob backdrop + stronger hierarchy; accent on key word (e.g. **yet**); keep reassurance card |
| Problem naming | Larger tactile cards; stronger selected state; keep validation microcopy |
| Pet basics | Slightly larger inputs/chips; optional small blob wash behind form |
| Goal | Same as problems — card press scale |
| Care focus | Chip selected = accent fill + inverse label; keep validation line |
| Processing | Soft pulse on spinner/blob; keep rotating lines + duration |
| Plan reveal | Blob + accent headline; summary cards feel more “premium” |
| Commitment | Blob; pledge row more button-like; CTA remains gated on checkbox |

### Motion budget
- Chip/card press: scale ~0.97–0.98 on pressIn/out
- Step change: ~220–280ms opacity + translate
- Processing: gentle opacity pulse on hero/spinner
- Respect reduced motion if the app already has a pattern; otherwise keep animations short and subtle

## Out of scope

- Pre-quiz walkthrough carousel or extra intro phase
- Changing `resolveOnboardingGate`, draft model (except no model changes), paywall monetization
- Replacing psychology copy with meal-delivery marketing copy
- New illustration photography pipeline (use SVG/shapes + existing assets only unless we already have pet images in `shared/assets`)
- Full auth/paywall redesign (optional later pass)

## Success criteria

1. Funnel behavior identical (same steps, gates, analytics event names)
2. Visual read: warmer, more “product onboarding”, closer to the reference’s energy
3. No hardcoded hex/spacing in feature UI; dark mode still readable
4. Interaction: selections and Continue feel more tactile than today
5. No new onboarding phase or storage keys required

## Implementation notes

- Prefer composing shared primitives over one-off styles per step
- Keep `trackEvent` call sites unchanged
- Screenshots / device check: light + dark on Trust, Problem, Care focus, Plan reveal, Commitment
