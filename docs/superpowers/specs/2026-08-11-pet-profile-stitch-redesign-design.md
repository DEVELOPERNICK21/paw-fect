# Pet Profile Stitch Redesign Design

**Date:** 2026-08-11  
**Status:** Approved for planning  
**Approach:** Shared Stitch-inspired chrome components; restyle `PetBasicsStep` + `AddPetScreen` in place; keep theme tokens and all existing Add/Edit fields/logic

## Goal

Make pet onboarding and Add/Edit Pet feel interactive and aligned with the Stitch “Add/Edit Pet Profile” mock (hero photo, caps labels, filled fields, species cards, strong CTA), while preserving Pawsoul theme tokens and current save/validation/photo pipelines.

## Decisions

| Topic | Choice |
| --- | --- |
| Surfaces | **Both** — onboarding `PetBasicsStep` + Add/Edit `AddPetScreen` |
| Theme | **App tokens** (light/dark) — Stitch layout/hierarchy/interaction, not forced navy |
| Add/Edit fields | **Keep all** current fields; basics first, advanced sections below |
| Implementation | Approach 1 — shared chrome components + restyle in place |
| Visual source | Stitch screenshot (API HTML fetch blocked with 403) |

## Current baseline

- `PetBasicsStep`: nickname, species chips (dog/cat/both), age-band chips; blob backdrop; no photo
- `AddPetScreen`: photo pick + encode-on-save, name, type, DOB, gender, breed, lifestyle, region, health history; psychology chrome; longer form
- Photo pipeline already exists (`pickPetPhoto` → `PreparePetPhoto` → Firestore data URI)

## Architecture

```
Shared pet chrome
  PetPhotoHero
  PetFieldLabel
  PetFilledField
  PetSpeciesCards
  PetPrimaryCta
        │
        ├─ PetBasicsStep (onboarding draft)
        └─ AddPetScreen (create + edit)
```

**Non-goals for architecture:** new navigation routes, schema changes, store/API changes beyond UI wiring.

## Layout & interaction

### Fold (shared pattern)

1. Title + subtitle  
2. `PetPhotoHero` (camera badge → existing picker sheet)  
3. Italic helper when name present (personalized copy)  
4. **PET NAME** + filled field  
5. **SPECIES** + Dog/Cat cards  
6. Next control:  
   - Onboarding → **ESTIMATED AGE** (existing age bands, Stitch-styled control)  
   - Add/Edit → **DATE OF BIRTH** (existing date picker in filled-field chrome)

### Add/Edit below the fold

Gender, breed, lifestyle, region, health history — same logic; restyled to match filled fields / selection cards and Stitch spacing rhythm. Existing psychology/progress chrome may be simplified or restyled if it fights the new hierarchy (do not remove entitlement/limit messaging without a replacement).

### CTAs

| Mode | Label |
| --- | --- |
| Onboarding | Funnel continue (host-owned) |
| Add | Complete Profile → |
| Edit | Save Changes → |

### Motion

- Species card press scale (`ScalePressable` or equivalent)
- Camera badge press feedback
- CTA press opacity  
No heavy page transitions.

### Copy

- Add / onboarding title: “Tell us about your pet.”  
- Edit title: “Edit your pet.”  
- Subtitle: “Let's get the basics down so we can tailor their experience.”

## Constraints

- Theme tokens only — no hardcoded Stitch navy/gold hex in feature UI  
- Preserve photo encode-on-save and permission handling  
- Preserve Add/Edit validation (name required; DOB rules as today)  
- Onboarding remains age-band draft (no DOB on that step)  
- Named exports; clean architecture boundaries unchanged

## Out of scope

- Firestore / pet model changes  
- Multi-step Add/Edit wizard  
- Crop/filter UI  
- Stitch HTML export integration  
- Pet Profile hero / home card redesign

## Success criteria

- Onboarding pet step and Add/Edit visually read like the Stitch mock in structure and interaction  
- Light and dark modes remain readable with tokens  
- Add and edit still persist all existing fields; photo flow still works  
- Species and camera feel responsive

## Relation to other work

Builds on pet photo base64 feature. Separate from tab-bar / RN upgrade tracks.
