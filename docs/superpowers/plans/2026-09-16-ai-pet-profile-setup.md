# AI Pet Profile Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a user picks a pet photo on Add Pet or onboarding, run on-device ML Kit analysis and show species/breed/quality suggestions that apply only when the user taps Confirm.

**Architecture:** Domain port `PetPhotoAnalyzer` + pure mapping utils + `AnalyzePetPhoto` use case. ML Kit adapter in `data/photos`. Shared `PetPhotoAnalysisCard` in pets UI. Composition wires analyzer like `PreparePetPhoto`. UI never imports ML Kit.

**Tech Stack:** React Native 0.86.2, TypeScript, Jest, `@react-native-ml-kit/image-labeling`, existing `react-native-image-picker`, Zustand, PostHog `trackEvent`.

## Global Constraints

- **Confirm required** — never auto-fill species/breed without user tap.
- **Low confidence** — show best guess + soft warning; never block save or manual entry.
- **Copy** — “We think…” / “Possible breed”; never “AI identified your pet”.
- **On-device only** — no cloud photo upload for analysis in Phase 1.
- **Domain layer** must not import ML Kit, image-picker, or React Native.
- **Theme tokens only** in UI (`useTheme`); explicit return types on exported functions.
- **Analytics** — no photo URLs, base64, or raw label lists in event payloads.
- Spec: `docs/superpowers/specs/2026-09-16-ai-pet-profile-setup-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/modules/pets/domain/ports/PetPhotoAnalyzer.ts` | Port + analysis types |
| Create: `src/modules/pets/domain/utils/petPhotoAnalysisMapping.ts` | Label map, thresholds, quality rules |
| Create: `src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts` | Mapping unit tests |
| Create: `src/modules/pets/domain/usecases/AnalyzePetPhoto.ts` | Use case orchestrating analyzer + mapping |
| Create: `src/modules/pets/domain/usecases/__tests__/AnalyzePetPhoto.test.ts` | Use case tests with fake analyzer |
| Create: `src/modules/pets/data/photos/MlKitPetPhotoAnalyzer.ts` | ML Kit adapter |
| Create: `src/modules/pets/data/photos/__tests__/MlKitPetPhotoAnalyzer.test.ts` | Adapter smoke test (mocked ML Kit) |
| Create: `src/modules/pets/ui/components/PetPhotoAnalysisCard.tsx` | Shared suggestion card UI |
| Create: `src/modules/pets/ui/components/__tests__/PetPhotoAnalysisCard.test.tsx` | Card interaction tests |
| Modify: `src/modules/pets/petComposition.ts` | Wire analyzer + use case |
| Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx` | Trigger analysis after pick; show card |
| Modify: `src/modules/app/domain/onboarding/OnboardingDraft.ts` | Optional `breed` on `PetDraft` |
| Modify: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx` | Photo pick + analysis card |
| Modify: `src/modules/pets/domain/utils/prefillFromOnboardingProfile.ts` | Prefill breed from onboarding draft |
| Modify: `package.json` / lockfile | Add ML Kit dependency |
| Modify: `ios/Podfile.lock` (via pod install) | Native iOS link |
| Modify: `docs/superpowers/specs/2026-09-16-ai-pet-profile-setup-design.md` | Status → Approved |

---

### Task 1: Domain types + mapping utils (TDD)

**Files:**
- Create: `src/modules/pets/domain/ports/PetPhotoAnalyzer.ts`
- Create: `src/modules/pets/domain/utils/petPhotoAnalysisMapping.ts`
- Create: `src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type PetPhotoQuality = 'good' | 'fair' | 'poor'`
  - `export type PetPhotoSpecies = 'dog' | 'cat' | 'unknown'`
  - `export type RawImageLabel = { label: string; confidence: number }`
  - `export type PetPhotoBreedSuggestion = { label: string; confidence: number }`
  - `export type PetPhotoAnalysis = { species, speciesConfidence, breedSuggestions, quality, qualityHint, lowConfidence, rawLabels? }`
  - `export interface PetPhotoAnalyzer { analyze(localImageUri: string): Promise<PetPhotoAnalysis> }`
  - `export function mapLabelsToPetPhotoAnalysis(labels: RawImageLabel[]): PetPhotoAnalysis`
  - Constants: `SPECIES_LOW_CONFIDENCE_THRESHOLD = 0.55`, `SPECIES_TIE_DELTA = 0.15`, `MAX_BREED_SUGGESTIONS = 3`

- [ ] **Step 1: Write failing mapping tests**

`src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts`:

```typescript
import { mapLabelsToPetPhotoAnalysis } from '../petPhotoAnalysisMapping';

describe('mapLabelsToPetPhotoAnalysis', () => {
  it('maps clear dog labels to dog species with breed suggestions', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.92 },
      { label: 'Golden retriever', confidence: 0.84 },
      { label: 'Labrador retriever', confidence: 0.06 },
    ]);

    expect(result.species).toBe('dog');
    expect(result.lowConfidence).toBe(false);
    expect(result.breedSuggestions[0]?.label).toBe('Golden Retriever');
    expect(result.quality).toBe('good');
  });

  it('maps clear cat labels to cat species', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Cat', confidence: 0.91 },
      { label: 'Persian cat', confidence: 0.72 },
    ]);

    expect(result.species).toBe('cat');
    expect(result.breedSuggestions[0]?.label).toBe('Persian');
  });

  it('flags low confidence when dog and cat scores are close', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.52 },
      { label: 'Cat', confidence: 0.48 },
    ]);

    expect(result.lowConfidence).toBe(true);
    expect(result.species).toBe('dog');
  });

  it('returns unknown species and poor quality for non-pet labels', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Person', confidence: 0.95 },
      { label: 'Food', confidence: 0.4 },
    ]);

    expect(result.species).toBe('unknown');
    expect(result.quality).toBe('poor');
    expect(result.breedSuggestions).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement port types**

`src/modules/pets/domain/ports/PetPhotoAnalyzer.ts`:

```typescript
export type PetPhotoQuality = 'good' | 'fair' | 'poor';
export type PetPhotoSpecies = 'dog' | 'cat' | 'unknown';

export type RawImageLabel = {
  label: string;
  confidence: number;
};

export type PetPhotoBreedSuggestion = {
  label: string;
  confidence: number;
};

export type PetPhotoAnalysis = {
  species: PetPhotoSpecies;
  speciesConfidence: number;
  breedSuggestions: PetPhotoBreedSuggestion[];
  quality: PetPhotoQuality;
  qualityHint: string;
  lowConfidence: boolean;
  rawLabels?: RawImageLabel[];
};

export interface PetPhotoAnalyzer {
  analyze(localImageUri: string): Promise<PetPhotoAnalysis>;
}
```

- [ ] **Step 4: Implement mapping utils**

`src/modules/pets/domain/utils/petPhotoAnalysisMapping.ts` — include:
- `DOG_LABELS`, `CAT_LABELS`, `BREED_LABEL_MAP` (curated ~40–60 entries)
- `normalizeLabel(label: string): string`
- `scoreSpecies(labels): { dog, cat, unknown }`
- `pickBreedSuggestions(labels): PetPhotoBreedSuggestion[]` (max 3, deduped)
- `deriveQuality(species, speciesConfidence, labels): { quality, qualityHint }`
- `mapLabelsToPetPhotoAnalysis(labels): PetPhotoAnalysis`

- [ ] **Step 5: Run tests**

Run: `yarn test -- src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/pets/domain/ports/PetPhotoAnalyzer.ts \
  src/modules/pets/domain/utils/petPhotoAnalysisMapping.ts \
  src/modules/pets/domain/utils/__tests__/petPhotoAnalysisMapping.test.ts
git commit -m "feat(pets): add pet photo analysis domain types and label mapping"
```

---

### Task 2: AnalyzePetPhoto use case (TDD)

**Files:**
- Create: `src/modules/pets/domain/usecases/AnalyzePetPhoto.ts`
- Create: `src/modules/pets/domain/usecases/__tests__/AnalyzePetPhoto.test.ts`

**Interfaces:**
- Consumes: `PetPhotoAnalyzer.analyze(localImageUri)`, `mapLabelsToPetPhotoAnalysis` (via analyzer returning mapped analysis OR raw labels — prefer analyzer returns mapped analysis; use case handles errors)
- Produces: `export class AnalyzePetPhoto { execute(localImageUri: string): Promise<PetPhotoAnalysis> }`

- [ ] **Step 1: Write failing use case tests**

```typescript
import { AnalyzePetPhoto } from '../AnalyzePetPhoto';
import type { PetPhotoAnalyzer, PetPhotoAnalysis } from '../../ports/PetPhotoAnalyzer';

const analysis: PetPhotoAnalysis = {
  species: 'dog',
  speciesConfidence: 0.9,
  breedSuggestions: [{ label: 'Golden Retriever', confidence: 0.8 }],
  quality: 'good',
  qualityHint: 'Good for profile photo',
  lowConfidence: false,
};

const fakeAnalyzer: PetPhotoAnalyzer = {
  analyze: jest.fn(async () => analysis),
};

describe('AnalyzePetPhoto', () => {
  it('returns analyzer result for valid uri', async () => {
    const useCase = new AnalyzePetPhoto(fakeAnalyzer);
    const result = await useCase.execute('file:///photo.jpg');
    expect(result).toEqual(analysis);
  });

  it('returns safe fallback when analyzer throws', async () => {
    const failing: PetPhotoAnalyzer = {
      analyze: jest.fn(async () => {
        throw new Error('ml failed');
      }),
    };
    const useCase = new AnalyzePetPhoto(failing);
    const result = await useCase.execute('file:///photo.jpg');
    expect(result.species).toBe('unknown');
    expect(result.lowConfidence).toBe(true);
    expect(result.quality).toBe('poor');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test -- src/modules/pets/domain/usecases/__tests__/AnalyzePetPhoto.test.ts`

- [ ] **Step 3: Implement use case**

```typescript
import type { PetPhotoAnalyzer, PetPhotoAnalysis } from '../ports/PetPhotoAnalyzer';

export class AnalyzePetPhoto {
  constructor(private readonly analyzer: PetPhotoAnalyzer) {}

  async execute(localImageUri: string): Promise<PetPhotoAnalysis> {
    const trimmed = localImageUri.trim();
    if (trimmed.length === 0) {
      return emptyAnalysis();
    }
    try {
      return await this.analyzer.analyze(trimmed);
    } catch {
      return emptyAnalysis();
    }
  }
}

function emptyAnalysis(): PetPhotoAnalysis {
  return {
    species: 'unknown',
    speciesConfidence: 0,
    breedSuggestions: [],
    quality: 'poor',
    qualityHint: 'Try another photo — we could not analyze this one.',
    lowConfidence: true,
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/modules/pets/domain/usecases/AnalyzePetPhoto.ts \
  src/modules/pets/domain/usecases/__tests__/AnalyzePetPhoto.test.ts
git commit -m "feat(pets): add AnalyzePetPhoto use case with safe fallback"
```

---

### Task 3: ML Kit dependency + adapter

**Files:**
- Modify: `package.json`, `yarn.lock`
- Create: `src/modules/pets/data/photos/MlKitPetPhotoAnalyzer.ts`
- Create: `src/modules/pets/data/photos/__tests__/MlKitPetPhotoAnalyzer.test.ts`

**Interfaces:**
- Consumes: `@react-native-ml-kit/image-labeling`, `mapLabelsToPetPhotoAnalysis`
- Produces: `export function createMlKitPetPhotoAnalyzer(): PetPhotoAnalyzer`

- [ ] **Step 1: Add dependency**

```bash
yarn add @react-native-ml-kit/image-labeling
cd ios && bundle exec pod install && cd ..
```

- [ ] **Step 2: Write adapter test with mocked ML Kit**

```typescript
jest.mock('@react-native-ml-kit/image-labeling', () => ({
  __esModule: true,
  default: {
    label: jest.fn(),
  },
}));

import ImageLabeling from '@react-native-ml-kit/image-labeling';
import { createMlKitPetPhotoAnalyzer } from '../MlKitPetPhotoAnalyzer';

describe('MlKitPetPhotoAnalyzer', () => {
  it('maps ML Kit labels through domain mapping', async () => {
    (ImageLabeling.label as jest.Mock).mockResolvedValueOnce([
      { text: 'Dog', confidence: 0.9 },
      { text: 'Golden retriever', confidence: 0.8 },
    ]);
    const analyzer = createMlKitPetPhotoAnalyzer();
    const result = await analyzer.analyze('file:///a.jpg');
    expect(result.species).toBe('dog');
    expect(ImageLabeling.label).toHaveBeenCalledWith('file:///a.jpg');
  });
});
```

- [ ] **Step 3: Implement adapter**

`src/modules/pets/data/photos/MlKitPetPhotoAnalyzer.ts`:

```typescript
import ImageLabeling from '@react-native-ml-kit/image-labeling';

import type { PetPhotoAnalyzer } from '../../domain/ports/PetPhotoAnalyzer';
import { mapLabelsToPetPhotoAnalysis } from '../../domain/utils/petPhotoAnalysisMapping';

export function createMlKitPetPhotoAnalyzer(): PetPhotoAnalyzer {
  return {
    async analyze(localImageUri) {
      const labels = await ImageLabeling.label(localImageUri);
      const normalized = labels.map(row => ({
        label: row.text,
        confidence: row.confidence,
      }));
      const analysis = mapLabelsToPetPhotoAnalysis(normalized);
      return { ...analysis, rawLabels: normalized };
    },
  };
}
```

- [ ] **Step 4: Run adapter test**

Run: `yarn test -- src/modules/pets/data/photos/__tests__/MlKitPetPhotoAnalyzer.test.ts`

- [ ] **Step 5: Manual smoke on device**

Run app on physical device; temporarily log labels from a dog photo in dev. Verify ML Kit returns labels.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock ios/Podfile.lock \
  src/modules/pets/data/photos/MlKitPetPhotoAnalyzer.ts \
  src/modules/pets/data/photos/__tests__/MlKitPetPhotoAnalyzer.test.ts
git commit -m "feat(pets): add ML Kit pet photo analyzer adapter"
```

---

### Task 4: Composition wiring

**Files:**
- Modify: `src/modules/pets/petComposition.ts`

**Interfaces:**
- Consumes: `createMlKitPetPhotoAnalyzer`, `AnalyzePetPhoto`
- Produces: `petComposition.analyzePetPhoto: AnalyzePetPhoto`

- [ ] **Step 1: Wire in composition root**

```typescript
import { AnalyzePetPhoto } from './domain/usecases/AnalyzePetPhoto';
import { createMlKitPetPhotoAnalyzer } from './data/photos/MlKitPetPhotoAnalyzer';

const petPhotoAnalyzer = createMlKitPetPhotoAnalyzer();

export const petComposition = {
  // ...existing
  analyzePetPhoto: new AnalyzePetPhoto(petPhotoAnalyzer),
} as const;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/modules/pets/petComposition.ts
git commit -m "feat(pets): wire AnalyzePetPhoto in pet composition"
```

---

### Task 5: PetPhotoAnalysisCard UI

**Files:**
- Create: `src/modules/pets/ui/components/PetPhotoAnalysisCard.tsx`
- Create: `src/modules/pets/ui/components/__tests__/PetPhotoAnalysisCard.test.tsx`

**Interfaces:**
- Consumes: `PetPhotoAnalysis` type
- Produces: `export const PetPhotoAnalysisCard: React.FC<Props>` with props:
  - `photoUri: string`
  - `status: 'analyzing' | 'ready' | 'failed'`
  - `analysis?: PetPhotoAnalysis`
  - `onConfirm: (selection: { species: 'dog' | 'cat'; breed?: string }) => void`
  - `onSkip: () => void`

- [ ] **Step 1: Write failing interaction test**

Test cases:
- Renders analyzing spinner when `status === 'analyzing'`
- Renders species line + breed chips when ready
- Confirm calls `onConfirm` with selected breed
- Skip calls `onSkip`
- Shows low-confidence warning when `analysis.lowConfidence`

- [ ] **Step 2: Implement card with theme tokens**

Use `useTheme` for colors/spacing/radius/textStyles. Include:
- Species emoji line: dog 🐶 / cat 🐱 / unknown
- Breed chips (max 3) + “Something else”
- Quality line with icon
- Primary CTA “Confirm suggestions”, secondary “Skip”

- [ ] **Step 3: Run tests**

Run: `yarn test -- src/modules/pets/ui/components/__tests__/PetPhotoAnalysisCard.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/modules/pets/ui/components/PetPhotoAnalysisCard.tsx \
  src/modules/pets/ui/components/__tests__/PetPhotoAnalysisCard.test.tsx
git commit -m "feat(pets): add PetPhotoAnalysisCard suggestion UI"
```

---

### Task 6: AddPetScreen integration

**Files:**
- Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx`

**Interfaces:**
- Consumes: `petComposition.analyzePetPhoto`, `PetPhotoAnalysisCard`, `trackEvent`
- Produces: Analysis triggered after successful `handlePick`; Confirm updates `petType` + `breed` + expands About section

- [ ] **Step 1: Add analysis state**

```typescript
type PhotoAnalysisUiState =
  | { visible: false }
  | { visible: true; status: 'analyzing'; photoUri: string }
  | { visible: true; status: 'ready' | 'failed'; photoUri: string; analysis?: PetPhotoAnalysis };

const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisUiState>({ visible: false });
```

- [ ] **Step 2: After successful pick, start analysis**

In `handlePick` after `setPhotoUri`:

```typescript
setPhotoAnalysis({ visible: true, status: 'analyzing', photoUri: picked.localUri });
void trackEvent('pet_photo_analysis_started', { surface: 'add_pet' });
try {
  const analysis = await petComposition.analyzePetPhoto.execute(picked.localUri);
  setPhotoAnalysis({ visible: true, status: 'ready', photoUri: picked.localUri, analysis });
  void trackEvent('pet_photo_analysis_completed', {
    species: analysis.species,
    low_confidence: analysis.lowConfidence,
    quality: analysis.quality,
  });
} catch {
  setPhotoAnalysis({ visible: true, status: 'failed', photoUri: picked.localUri });
}
```

- [ ] **Step 3: Clear analysis on removePhoto / new pick**

- [ ] **Step 4: Render card below photo hero**

On Confirm:
```typescript
if (analysis.species === 'dog' || analysis.species === 'cat') {
  setPetType(analysis.species);
}
if (breedSelection) setBreed(breedSelection);
setShowAboutSection(true);
setPhotoAnalysis({ visible: false });
void trackEvent('pet_photo_analysis_confirmed', { ... });
```

On Skip: hide card + `pet_photo_analysis_skipped`.

- [ ] **Step 5: Manual QA on Add Pet create + edit flows**

- [ ] **Step 6: Commit**

```bash
git add src/modules/pets/ui/screens/AddPetScreen.tsx
git commit -m "feat(pets): integrate AI photo suggestions on Add Pet screen"
```

---

### Task 7: Onboarding integration

**Files:**
- Modify: `src/modules/app/domain/onboarding/OnboardingDraft.ts`
- Modify: `src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx`
- Modify: `src/modules/pets/domain/utils/prefillFromOnboardingProfile.ts`
- Modify: `src/modules/pets/domain/utils/__tests__/prefillFromOnboardingProfile.test.ts` (if exists) or create test

**Interfaces:**
- Consumes: `petComposition.pickPetPhoto`, `petComposition.analyzePetPhoto`, `PetPhotoAnalysisCard`
- Produces: `PetDraft` extended with optional `breed?: string`; photo pick + analysis in onboarding

- [ ] **Step 1: Extend PetDraft**

```typescript
export type PetDraft = {
  species: 'dog' | 'cat' | 'both';
  ageBand: 'puppy_kitten' | 'adult' | 'senior';
  nickname: string;
  breed?: string;
};
```

Update reducers/tests that construct default `PetDraft`.

- [ ] **Step 2: Wire photo pick in PetBasicsStep**

- Pass `onPressCamera` to `PetPhotoHero` (reuse Add Pet pick pattern with `InteractionManager` delay on Android).
- Keep `photoLocalUri` in component state (do not persist base64 in onboarding draft).
- Show `PetPhotoAnalysisCard` below hero when photo selected.

- [ ] **Step 3: On Confirm, update draft species + breed**

Map `dog`/`cat` analysis to `PetDraft.species` (`both` unchanged if user already picked both manually).

- [ ] **Step 4: Prefill breed in AddPet from onboarding**

Update `prefillFromOnboardingProfile` to include `breed` when present.

- [ ] **Step 5: Run affected tests**

Run: `yarn test -- src/modules/app/domain/onboarding src/modules/pets/domain/utils/prefillFromOnboardingProfile`

- [ ] **Step 6: Commit**

```bash
git add src/modules/app/domain/onboarding/OnboardingDraft.ts \
  src/modules/app/ui/onboarding/steps/PetBasicsStep.tsx \
  src/modules/pets/domain/utils/prefillFromOnboardingProfile.ts
git commit -m "feat(onboarding): add AI photo suggestions to pet basics step"
```

---

### Task 8: Final verification + spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-09-16-ai-pet-profile-setup-design.md`

- [ ] **Step 1: Run full test suite**

Run: `yarn test`

- [ ] **Step 2: Lint + typecheck**

Run: `yarn lint && npx tsc --noEmit`

- [ ] **Step 3: Device checklist**

- Dog photo → dog + breed suggestion + good quality
- Cat photo → cat + breed suggestion
- Person photo → unknown + poor + warning; manual entry works
- Confirm fills fields; Skip leaves unchanged
- Onboarding + Add Pet parity

- [ ] **Step 4: Update spec status to Approved — Phase 1 planned**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-16-ai-pet-profile-setup-design.md
git commit -m "docs: mark AI pet profile setup spec as approved"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| ML Kit on-device analysis | Task 3 |
| Confirm before apply | Tasks 5–7 |
| Add Pet + onboarding surfaces | Tasks 6–7 |
| Quality hint Good/Fair/Poor | Task 1 mapping |
| Low confidence soft warning | Tasks 1, 5 |
| PetPhotoAnalyzer port | Tasks 1–4 |
| Analytics events | Tasks 6–7 |
| No cloud upload | Task 3 (local URI only) |
| Unit tests for mapping | Task 1 |
| Out of scope items excluded | No tasks for OCR/memories/scanner |

No placeholders remain in task steps.
