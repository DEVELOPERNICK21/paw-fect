# AI Pet Profile Setup — Design

**Date:** 2026-09-16  
**Status:** Approved — Phase 1 planned  
**Approach:** ML Kit on-device analysis with Confirm-before-apply suggestions  
**Implementation:** Phase 1 only — AI-assisted pet setup (#1 from AI roadmap)

## Goal

Reduce pet profile setup friction by analyzing a photo on-device and suggesting species, breed, and photo quality. The user must **Confirm** before any suggestion is written to the form. AI supports the existing Smart Engine (schedules, reminders, health records); it is not the product itself.

**Product job:** “Add my pet faster with a photo — I stay in control.”

**Product verdict this design answers:** On-device AI is useful when it removes typing and feeds the care engine, not when marketed as exact breed identification or pet identity recognition.

## Decisions

| Topic | Choice |
| --- | --- |
| Feature scope | **#1 only** — AI Pet Profile setup |
| Surfaces (Phase 1) | Add Pet + onboarding `PetBasicsStep` |
| Later surface | Dedicated “Scan pet” entry (reuses same card + analyzer) |
| Apply behavior | **Suggest → Confirm required** (never auto-fill without tap) |
| Runtime (Phase 1) | **ML Kit** image labeling on-device |
| Runtime (later) | ExecuTorch via same `PetPhotoAnalyzer` port |
| Low confidence / bad photo | Soft warning + show best guess; **never block** manual entry |
| Quality hint | **Yes** — Good / Fair / Poor with advisory copy |
| UX pattern | **Approach 1** — suggestion card after photo pick |

## Current baseline

- Pet photos: camera + gallery via `pickPetPhoto`; stored as JPEG data URI on `Pet.photo`.
- Species: `PetType` = `dog` \| `cat` only.
- Breed: free-text field in `AddPetScreen` (no catalog/autocomplete).
- Onboarding prefills name + species from draft; no photo analysis today.
- No ML/AI dependencies in `package.json`.
- Clean Architecture: domain ports + composition roots; UI must not import ML SDKs directly.

## In scope (Phase 1)

- On-device photo analysis after successful pick (uses `localUri` from picker).
- Shared `PetPhotoAnalysisCard` component (Add Pet + onboarding).
- Species suggestion (dog / cat / unknown).
- Up to 3 breed suggestions from curated allowlist + “Something else”.
- Photo quality hint (Good / Fair / Poor).
- Soft warning when confidence is low.
- Confirm / Skip actions.
- Domain port `PetPhotoAnalyzer` + use case `AnalyzePetPhoto`.
- ML Kit adapter in infrastructure layer.
- Unit tests for label mapping, thresholds, quality heuristics.
- Analytics events (no photo payloads).

## Out of scope (Phase 1)

- Live VisionCamera “AI Scanner”.
- Photo memories / clustering / semantic search.
- Vet document OCR (ML Kit Phase 2).
- “Looks like Bruno” / image embeddings.
- Custom breed model training.
- Cloud API photo upload for analysis.
- Dedicated “Scan pet” navigation entry (Phase 1.1).

---

## User flow

```
Camera / Gallery
      ↓
PreparePetPhoto (existing)
      ↓
AnalyzePetPhoto (new)
      ↓
PetPhotoAnalysisCard
  • “This looks like a dog” (+ confidence)
  • Possible breeds (chips) + “Something else”
  • Photo quality: Good | Fair | Poor
  • Soft warning if lowConfidence
      ↓
[Confirm] → fill species + breed in form state only
[Skip]    → keep photo; user fills manually
      ↓
User completes name / DOB / save (unchanged)
      ↓
Smart health + reminders (unchanged)
```

### Copy rules

- Use “We think…” / “Possible breed” — never “AI identified your pet”.
- Never claim veterinary-grade breed identification.
- Low confidence: “Not sure — please check” (advisory only).

---

## Architecture

```
UI (AddPetScreen, PetBasicsStep)
  → AnalyzePetPhoto (use case)
  → PetPhotoAnalyzer (port)
  → MlKitPetPhotoAnalyzer (Phase 1)
  → ExecuTorchPetPhotoAnalyzer (future, same port)
```

### Domain types

```ts
type PetPhotoQuality = 'good' | 'fair' | 'poor';

type PetPhotoBreedSuggestion = {
  label: string;
  confidence: number; // 0–1
};

type PetPhotoAnalysis = {
  species: 'dog' | 'cat' | 'unknown';
  speciesConfidence: number;
  breedSuggestions: PetPhotoBreedSuggestion[]; // max 3
  quality: PetPhotoQuality;
  qualityHint: string;
  lowConfidence: boolean;
  rawLabels?: Array<{ label: string; confidence: number }>; // dev/analytics only
};

interface PetPhotoAnalyzer {
  analyze(localImageUri: string): Promise<PetPhotoAnalysis>;
}
```

### Use case: `AnalyzePetPhoto`

- Input: `localImageUri` from `PetPhotoEncodeRequest`.
- Calls `PetPhotoAnalyzer.analyze`.
- Applies mapping rules (species, breeds, quality, lowConfidence).
- On failure: returns safe empty-ish analysis + `lowConfidence: true`; UI shows failed/soft state.

### Infrastructure: `MlKitPetPhotoAnalyzer`

- Uses `@react-native-ml-kit/image-labeling` (or equivalent bare-RN ML Kit module).
- Runs entirely on-device; no network.
- Wired in `petComposition` alongside `PreparePetPhoto`.

### Composition

- Register `PetPhotoAnalyzer` in `petComposition`.
- Export `analyzePetPhoto` via composition root (store/UI calls use case, not adapter).

---

## Label mapping & heuristics

### Species

| ML Kit signal | Map to |
| --- | --- |
| Dog, puppy, dog breed labels | `dog` |
| Cat, kitten, cat breed labels | `cat` |
| Person, food, furniture, no animal | `unknown` |

- Species = highest dog vs cat score from mapped labels.
- `lowConfidence = true` when:
  - best species score **< 0.55**, or
  - dog and cat scores within **0.15** of each other.
- Always show best guess even when `lowConfidence` (never hide suggestions).

### Breed suggestions

- Curated allowlist (~40–60 common dog/cat breeds) mapped from ML Kit label strings.
- Return up to **3** suggestions sorted by confidence.
- UI: tappable chips; default select top suggestion.
- **“Something else”** → breed stays empty for manual entry.
- Unmapped high-confidence labels → title-cased raw label with “(best guess)” suffix.

Example mappings:

```
"golden retriever"     → Golden Retriever
"labrador retriever"   → Labrador Retriever
"persian cat"          → Persian
"german shepherd"      → German Shepherd
```

### Photo quality (Phase 1 heuristics)

| Signal | Quality | Hint |
| --- | --- | --- |
| Pet detected + adequate resolution + not extremely dark | `good` | “Good for profile photo” |
| Weak pet signal OR slightly dark/small in frame | `fair` | “Usable, but a clearer photo is better” |
| No pet / very blurry / very dark | `poor` | “Try another photo — we’re not sure this is your pet” |

Quality is advisory only — never blocks Confirm or save.

---

## UI: `PetPhotoAnalysisCard`

Shared component for Add Pet and onboarding.

### States

1. **Analyzing** — spinner over photo preview (“Analyzing photo…”)
2. **Suggestions** — results + Confirm / Skip
3. **Failed** — soft message; user continues manually

### Layout (suggestions)

```
┌─────────────────────────────────┐
│  [photo preview]                │
├─────────────────────────────────┤
│  🐶 This looks like a dog       │
│  ⚠️  Not sure — please check    │  ← if lowConfidence
├─────────────────────────────────┤
│  Possible breed                 │
│  [Golden Retriever ✓] [Lab]     │
│  [Something else]               │
├─────────────────────────────────┤
│  📸 Photo quality: Good         │
├─────────────────────────────────┤
│  [Confirm suggestions]  [Skip]  │
└─────────────────────────────────┘
```

### Confirm behavior

- Sets `petType` and `breed` in **local form state only**.
- Does not save pet or call remote APIs.
- Expands “About” section on Add Pet if breed was previously empty.

### Skip behavior

- Dismisses card; photo remains; no field changes.

### Re-analyze

- New photo pick replaces previous analysis and card state.

### Integration points

| Screen | Trigger | After Confirm |
| --- | --- | --- |
| `AddPetScreen` | After `pickPetPhoto` success | Updates species chips + breed input |
| `PetBasicsStep` | After photo added in onboarding | Updates draft species + optional breed |

---

## Analytics (Phase 1)

| Event | When | Properties |
| --- | --- | --- |
| `pet_photo_analysis_started` | Analysis begins | `{ surface: 'add_pet' \| 'onboarding' }` |
| `pet_photo_analysis_completed` | Analysis succeeds | `{ species, low_confidence, quality }` |
| `pet_photo_analysis_confirmed` | User taps Confirm | `{ species, breed_selected, was_suggestion }` |
| `pet_photo_analysis_skipped` | User taps Skip | `{ surface }` |

Do not include photo URLs, base64, or raw label lists in analytics payloads.

---

## Dependencies & native setup

- Add `@react-native-ml-kit/image-labeling` (evaluate bare-RN compatibility with RN 0.86.2).
- iOS: `pod install`.
- Android: autolink (verify against current `minSdkVersion`).
- Uses existing `localUri` from `react-native-image-picker` — no new upload path.

---

## Testing

### Unit tests

- Label → species mapping (dog, cat, unknown, tie/low confidence).
- Breed allowlist mapping + max 3 suggestions.
- Quality heuristic outputs.
- `AnalyzePetPhoto` failure → safe fallback.

### Manual device tests

- Clear dog photo → dog + breed suggestion + good quality.
- Clear cat photo → cat + breed suggestion.
- Person/food photo → unknown + poor quality + soft warning.
- Blurry pet → fair/poor + low confidence warning.
- Confirm fills form; Skip leaves form unchanged.
- Onboarding + Add Pet parity.

---

## Rollout

1. **Internal** — mapping tests on real devices (dog/cat/mixed/blurry).
2. **Beta** — Add Pet only.
3. **GA** — Add Pet + onboarding.
4. **Phase 1.1** — “Scan pet” shortcut (same analyzer + card).

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Wrong breed suggestion | Confirm required; “Something else”; no “exact ID” marketing |
| ML Kit misses dog/cat | Soft warning + manual entry; tune thresholds from analytics |
| Platform label differences | Shared mapping table + per-platform manual QA |
| Slow analysis on old devices | Spinner + timeout → failed state; manual entry always available |
| APK/IPA size | ML Kit only in Phase 1; monitor bundle impact before ExecuTorch |

---

## Success metrics (4 weeks post-GA)

| Metric | Intent |
| --- | --- |
| `% pet creates with photo` | Adoption of photo-first setup |
| `confirmed / started` analysis rate | ≥ 40% target |
| Time to complete Add Pet (with photo) | Should decrease |
| `% profiles with breed filled` | Should increase |
| Wrong-breed support complaints | Should stay low |

---

## Future phases (not this spec)

| Phase | Feature | Notes |
| --- | --- | --- |
| 1.1 | “Scan pet” entry | Reuse card + analyzer |
| 2 | Vet document OCR | ML Kit text recognition → health records |
| 3 | Pet photo embeddings | “Looks like Bruno”; requires multi-photo storage |
| 4 | ExecuTorch custom models | Replace/supplement ML Kit via same port |
| 5 | Live VisionCamera scanner | After static photo flow proves value |

---

## File map (implementation preview)

| File | Responsibility |
| --- | --- |
| `src/modules/pets/domain/ports/PetPhotoAnalyzer.ts` | Port + analysis types |
| `src/modules/pets/domain/usecases/AnalyzePetPhoto.ts` | Use case + mapping orchestration |
| `src/modules/pets/domain/utils/petPhotoAnalysisMapping.ts` | Label map, thresholds, quality rules |
| `src/modules/pets/data/photos/MlKitPetPhotoAnalyzer.ts` | ML Kit adapter |
| `src/modules/pets/ui/components/PetPhotoAnalysisCard.tsx` | Shared suggestion UI |
| `src/modules/pets/petComposition.ts` | Wire analyzer + use case |
| `src/modules/pets/ui/screens/AddPetScreen.tsx` | Integrate card after photo pick |
| `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx` | Integrate card after photo pick |
| Tests alongside source files | Mapping + use case + UI behavior |

---

## Self-review checklist

- [x] Scope limited to Phase 1 (#1 AI Pet Profile setup)
- [x] Confirm-before-apply enforced in UX and architecture
- [x] ML Kit Phase 1; ExecuTorch deferred with port abstraction
- [x] Low confidence + quality rules match user decisions (A+C, quality hint B)
- [x] No cloud upload; fits offline-first positioning
- [x] Analytics defined without photo payloads
- [x] Out of scope explicitly lists features 2–5 from AI roadmap
- [x] Integration points reference existing screens and Smart Engine handoff
