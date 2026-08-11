# Pet Profile Stitch Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle onboarding `PetBasicsStep` and Add/Edit `AddPetScreen` to match the Stitch pet-profile layout (hero photo, caps labels, filled fields, species cards, strong CTA) using shared chrome and Pawsoul theme tokens, without changing save/validation/photo pipelines or pet schema.

**Architecture:** Add presentational components under `src/shared/components/petForm/` so both `app` (onboarding) and `pets` can import them without feature-to-feature UI coupling. Restyle both screens in place; keep all Add/Edit fields; onboarding age bands unchanged; onboarding photo hero is display-only (no draft photo field — schema out of scope).

**Tech Stack:** React Native, TypeScript, existing `useTheme` tokens, `ScalePressable` pattern (promote to shared), existing `pickPetPhoto` / `PreparePetPhoto`, Jest + `react-test-renderer`.

## Global Constraints

- Theme tokens only — no hardcoded Stitch navy/gold hex in feature UI.
- Preserve photo encode-on-save and permission handling on Add/Edit.
- Preserve Add/Edit validation (name required; DOB rules as today).
- Onboarding remains age-band draft (no DOB on that step); `PetDraft` unchanged.
- Surfaces: `PetBasicsStep` + `AddPetScreen` (add and edit).
- Copy: Add/onboarding title “Tell us about your pet.”; edit “Edit your pet.”; subtitle “Let's get the basics down so we can tailor their experience.”
- CTAs: Add “Complete Profile →”; Edit “Save Changes →”; onboarding continue stays host-owned.
- Named exports; no Firestore/model changes; no multi-step wizard; no crop UI.
- Spec: `docs/superpowers/specs/2026-08-11-pet-profile-stitch-redesign-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/shared/components/ScalePressable.tsx` | Move/promote press-scale helper from onboarding |
| Create: `src/shared/components/petForm/PetFieldLabel.tsx` | Caps field label |
| Create: `src/shared/components/petForm/PetFilledField.tsx` | Filled text input + pressable row |
| Create: `src/shared/components/petForm/PetPhotoHero.tsx` | Circular avatar + optional camera badge + caption |
| Create: `src/shared/components/petForm/PetSpeciesCards.tsx` | Horizontal species option cards |
| Create: `src/shared/components/petForm/PetPrimaryCta.tsx` | Full-width primary CTA with trailing arrow |
| Create: `src/shared/components/petForm/index.ts` | Barrel exports |
| Create: `src/shared/components/petForm/__tests__/PetSpeciesCards.test.tsx` | Selection callback smoke test |
| Modify: `src/modules/app/ui/onboarding/components/ScalePressable.tsx` | Re-export from shared |
| Modify: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx` | Stitch layout using shared chrome |
| Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx` | Stitch fold + restyle fields + CTA labels |

---

### Task 1: Shared ScalePressable + petForm chrome

**Files:**
- Create: `src/shared/components/ScalePressable.tsx`
- Create: `src/shared/components/petForm/PetFieldLabel.tsx`
- Create: `src/shared/components/petForm/PetFilledField.tsx`
- Create: `src/shared/components/petForm/PetPhotoHero.tsx`
- Create: `src/shared/components/petForm/PetSpeciesCards.tsx`
- Create: `src/shared/components/petForm/PetPrimaryCta.tsx`
- Create: `src/shared/components/petForm/index.ts`
- Create: `src/shared/components/petForm/__tests__/PetSpeciesCards.test.tsx`
- Modify: `src/modules/app/ui/onboarding/components/ScalePressable.tsx` (re-export)

**Interfaces:**
- Consumes: `useTheme`, `icons.dogIcon` / `icons.catIcon`, camera icon, `Image` / `ImageSourcePropType`
- Produces:
  - `ScalePressable` from shared
  - `PetFieldLabel({ children: string })`
  - `PetFilledTextInput({ value, onChangeText, placeholder?, leftAccessory? })`
  - `PetFilledRow({ title: string, onPress, leftAccessory?, rightAccessory?, accessibilityLabel? })`
  - `PetPhotoHero({ photoSource?, placeholder?, caption?, onPressCamera?, accessibilityLabel? })`
  - `PetSpeciesOption = { id: string; label: string; kind: 'dog' | 'cat' | 'other' }`
  - `PetSpeciesCards({ options, value, onChange })`
  - `PetPrimaryCta({ title, onPress, loading?, disabled? })`

- [ ] **Step 1: Write failing PetSpeciesCards test**

```tsx
import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { PetSpeciesCards } from '../PetSpeciesCards';

describe('PetSpeciesCards', () => {
  it('calls onChange with the selected option id', () => {
    const onChange = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetSpeciesCards
          options={[
            { id: 'dog', label: 'Dog', kind: 'dog' },
            { id: 'cat', label: 'Cat', kind: 'cat' },
          ]}
          value="dog"
          onChange={onChange}
        />,
      );
    });
    const cat = tree!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityState?.checked === false,
    )[0];
    act(() => {
      cat.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('cat');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test --watchAll=false -- src/shared/components/petForm/__tests__/PetSpeciesCards.test.tsx`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement shared ScalePressable**

Copy implementation from `src/modules/app/ui/onboarding/components/ScalePressable.tsx` into `src/shared/components/ScalePressable.tsx`. Replace onboarding file with:

```typescript
export { ScalePressable } from '../../../../../shared/components/ScalePressable';
```

- [ ] **Step 4: Implement petForm components**

Use `useTheme()` tokens only:

- `PetFieldLabel`: uppercase small label, secondary text color, semibold
- `PetFilledTextInput` / `PetFilledRow`: ~56 height, `radius.lg`, surface fill, subtle border
- `PetPhotoHero`: large circle, optional camera badge (`colors.accent`/`primary`) when `onPressCamera` set; italic caption when provided
- `PetSpeciesCards`: equal-width cards; dog/cat icons from `icons`; selected filled accent; `ScalePressable` + `accessibilityRole="radio"`
- `PetPrimaryCta`: full-width primary, title + trailing arrow; loading/disabled

Export from `index.ts`.

- [ ] **Step 5: Run test — expect PASS**

Run: `yarn test --watchAll=false -- src/shared/components/petForm/__tests__/PetSpeciesCards.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/ScalePressable.tsx \
  src/shared/components/petForm \
  src/modules/app/ui/onboarding/components/ScalePressable.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add shared pet form chrome for Stitch redesign

Promote ScalePressable and add photo hero, labels, filled fields, species cards, and primary CTA.
EOF
)"
```

---

### Task 2: Restyle PetBasicsStep (onboarding)

**Files:**
- Modify: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx`

**Interfaces:**
- Consumes: petForm chrome; existing `PetDraft` / `onChange`
- Produces: Same props API; Stitch layout
- `PetPhotoHero` without `onPressCamera` (no draft photo)
- Species: dog / cat / both (`kind: 'other'` for both)
- Age: three bands as selectable cards/chips under **ESTIMATED AGE** (must stay one-tap)
- Copy per global constraints; nickname → PET NAME
- Prefer removing `OnboardingBlobBackdrop` on this step if it fights the fold
- Do not add `PetPrimaryCta` (funnel host owns continue)

- [ ] **Step 1: Rewrite PetBasicsStep layout using shared chrome**

Wire `onChange` exactly as today for species, ageBand, nickname.

- [ ] **Step 2: Manual check**

Onboarding pet step updates draft; light/dark readable.

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): restyle PetBasicsStep with Stitch pet form chrome

Align nickname, species, and age controls with the shared interactive pet profile layout.
EOF
)"
```

---

### Task 3: Restyle AddPetScreen fold + CTA

**Files:**
- Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx`

**Interfaces:**
- Consumes: petForm chrome; existing photo/save handlers
- Produces: Same save/nav behavior; new fold visuals and CTA copy

- [ ] **Step 1: Replace header + avatar + name + type**

- Titles/subtitle per constraints
- Compact entitlement messaging (do not drop pet-limit info)
- `PetPhotoHero` with `onPressCamera={openPhotoOptions}` and personalized caption
- Name via `PetFilledTextInput`; type via `PetSpeciesCards` (dog/cat)
- DOB: `PetFieldLabel` DATE OF BIRTH + existing `DatePickerField` in filled chrome

- [ ] **Step 2: Swap save button for PetPrimaryCta**

Add: `Complete Profile →` / Edit: `Save Changes →`; keep errors above CTA; wire existing save.

- [ ] **Step 3: Smoke Add + Edit (photo encode still works)**

- [ ] **Step 4: Commit**

```bash
git add src/modules/pets/ui/screens/AddPetScreen.tsx
git commit -m "$(cat <<'EOF'
feat(pets): restyle Add/Edit Pet fold to Stitch profile chrome

Use shared hero, species cards, and Complete Profile / Save Changes CTAs while keeping photo save logic.
EOF
)"
```

---

### Task 4: Restyle remaining AddPet fields + verify

**Files:**
- Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx`

**Interfaces:**
- Consumes: `PetFieldLabel`, filled controls / ScalePressable chips
- Produces: Consistent advanced sections; logic unchanged

- [ ] **Step 1: Restyle gender, breed, lifestyle, region, health blocks**

Caps labels + filled/card selection language; do not remove fields.

- [ ] **Step 2: Tests**

```bash
yarn test --watchAll=false -- src/shared/components/petForm/__tests__/PetSpeciesCards.test.tsx
npx tsc --noEmit
```

Document pre-existing `tsc` failures if unrelated; no new errors in touched files.

- [ ] **Step 3: Manual checklist**

- Onboarding pet step Stitch-like; draft updates
- Add Pet Complete Profile creates pet; photo optional
- Edit Save Changes; photo change/remove works
- Light + dark readable

- [ ] **Step 4: Commit**

```bash
git add src/modules/pets/ui/screens/AddPetScreen.tsx
git commit -m "$(cat <<'EOF'
feat(pets): align remaining Add Pet fields with Stitch form chrome

Apply caps labels and filled controls to gender, lifestyle, and health sections.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Shared chrome components | 1 |
| Theme tokens only | 1–4 |
| PetBasicsStep restyle; age bands; no DOB | 2 |
| Add/Edit fold + copy + CTAs | 3 |
| Keep all advanced fields | 4 |
| Preserve photo pipeline | 3 |
| ScalePressable motion | 1–3 |

## Self-review notes

- Shared under `shared/` avoids app→pets UI imports.
- Onboarding photo display-only until draft supports photo (YAGNI).
- Species cards take option lists so “Both” remains on onboarding.
