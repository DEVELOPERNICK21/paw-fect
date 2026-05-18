# Pet Health Share Card — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Execute in order. Commit after each task. Each task ends in a working, testable state.

**Goal:** Ship the v1 Pet Health Share Card feature per `docs/pet-health-share-card-design.md`: a 1080×1350 PNG of a pet's identity + health snapshot, shared via the system share sheet, triggered from both the Pet Profile hero button and a post-task-completion celebration modal.

**Architecture:** Clean Architecture per `AGENTS.md`. New use case + view model live in `src/modules/pets/domain`. New share card view + screen live in `src/modules/pets/ui`. Milestone trigger logic lives in `src/modules/records/domain`. Cross-feature coordination via the existing `petComposition` and a new in-memory event queue on `smartHealthRecordStore`.

**Tech Stack:** React Native 0.84, TypeScript strict, Zustand, React Navigation (native-stack), `react-native-view-shot` (new dep), `Share` from `react-native` core.

**Reference:** All design decisions and visual specs live in `docs/pet-health-share-card-design.md`. This plan only covers execution.

---

## Phase 1 — Domain foundations (TDD)

### Task 1: Add `formatPetAgeShareLabel` to `petDobDisplay.ts`

Compact "2 yrs 4 mo" age formatter for the share card, separate from the existing long-form `formatPetAgeLabel`.

**Files:**
- Modify: `src/modules/pets/domain/utils/petDobDisplay.ts`
- Create: `src/modules/pets/domain/utils/__tests__/petDobDisplay.test.ts` (if it doesn't already exist; append cases otherwise)

- [ ] **Step 1: Write the failing tests**

Append to the test file:

```ts
import { formatPetAgeShareLabel } from '../petDobDisplay';

describe('formatPetAgeShareLabel', () => {
  const refNow = new Date('2026-05-11T12:00:00.000Z');

  it('returns null for blank / missing dob', () => {
    expect(formatPetAgeShareLabel(undefined, refNow)).toBeNull();
    expect(formatPetAgeShareLabel('', refNow)).toBeNull();
    expect(formatPetAgeShareLabel('   ', refNow)).toBeNull();
  });

  it('returns null for future dob', () => {
    expect(formatPetAgeShareLabel('2030-01-01', refNow)).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(formatPetAgeShareLabel('not-a-date', refNow)).toBeNull();
  });

  it('formats weeks when months would round to 0', () => {
    expect(formatPetAgeShareLabel('2026-05-01', refNow)).toBe('1 wk');
    expect(formatPetAgeShareLabel('2026-04-21', refNow)).toBe('2 wks');
  });

  it('formats months for < 12 months', () => {
    expect(formatPetAgeShareLabel('2026-04-11', refNow)).toBe('1 mo');
    expect(formatPetAgeShareLabel('2025-11-11', refNow)).toBe('6 mo');
  });

  it('formats just years when month component is 0', () => {
    expect(formatPetAgeShareLabel('2024-05-11', refNow)).toBe('2 yrs');
    expect(formatPetAgeShareLabel('2025-05-11', refNow)).toBe('1 yr');
  });

  it('formats years + months when both present', () => {
    expect(formatPetAgeShareLabel('2024-01-11', refNow)).toBe('2 yrs 4 mo');
    expect(formatPetAgeShareLabel('2023-09-11', refNow)).toBe('2 yrs 8 mo');
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
yarn test src/modules/pets/domain/utils/__tests__/petDobDisplay.test.ts
```

Expected: ALL `formatPetAgeShareLabel` cases fail with "formatPetAgeShareLabel is not a function" or similar.

- [ ] **Step 3: Implement the helper**

Append to `src/modules/pets/domain/utils/petDobDisplay.ts`:

```ts
/**
 * Compact age formatter for the share card (e.g. "2 yrs 4 mo", "6 mo", "3 wks").
 * Returns null when dob is missing, future, or invalid — so callers can drop
 * the age line entirely instead of printing a fallback.
 */
export function formatPetAgeShareLabel(
  dob: string | undefined,
  now = new Date(),
): string | null {
  if (!dob || !dob.trim()) {
    return null;
  }
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  if (birth.getTime() > now.getTime()) {
    return null;
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const monthsTotal = monthsBetweenCalendar(birth, now);

  if (monthsTotal >= 12) {
    const years = Math.floor(monthsTotal / 12);
    const months = monthsTotal % 12;
    const yLabel = years === 1 ? '1 yr' : `${years} yrs`;
    if (months === 0) {
      return yLabel;
    }
    return `${yLabel} ${months} mo`;
  }

  if (monthsTotal >= 1) {
    return `${monthsTotal} mo`;
  }

  const weeks = Math.floor((now.getTime() - birth.getTime()) / msPerWeek);
  if (weeks >= 1) {
    return weeks === 1 ? '1 wk' : `${weeks} wks`;
  }

  return null;
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
yarn test src/modules/pets/domain/utils/__tests__/petDobDisplay.test.ts
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/pets/domain/utils/petDobDisplay.ts \
        src/modules/pets/domain/utils/__tests__/petDobDisplay.test.ts
git commit -m "feat(pets): add formatPetAgeShareLabel for share card"
```

---

### Task 2: Add `SHARE_INSTALL_URL` constant

**Files:**
- Modify: `src/shared/constants/releaseBackend.ts`

- [ ] **Step 1: Add the constant**

Append to `src/shared/constants/releaseBackend.ts`:

```ts
/**
 * Public install / marketing page used as the trailing link in share-card
 * captions and on the card footer. v1 points to the static download page;
 * v1.1 will swap this for per-pet deep-link tokens.
 */
export const SHARE_INSTALL_URL = `${RELEASE_BACKEND_BASE_URL}/download`;
```

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/shared/constants/releaseBackend.ts
git commit -m "feat(shared): add SHARE_INSTALL_URL constant"
```

---

### Task 3: Create `PetHealthCardViewModel` model

**Files:**
- Create: `src/modules/pets/domain/models/PetHealthCardViewModel.ts`

- [ ] **Step 1: Create the file**

```ts
import type { ImageSourcePropType } from 'react-native';

export type PetHealthCardItemStatus = 'done' | 'due_in' | 'overdue';

export interface PetHealthCardItem {
  label: string;
  status: PetHealthCardItemStatus;
  detail: string;
}

export type PetHealthCardSnapshot =
  | { kind: 'items'; items: PetHealthCardItem[] }
  | { kind: 'empty'; speciesEmoji: string };

export interface PetHealthCardViewModel {
  pet: {
    name: string;
    breedLabel: string | null;
    ageLabel: string | null;
    photoSource: ImageSourcePropType;
  };
  snapshot: PetHealthCardSnapshot;
  footer: {
    urlLabel: string;
    brandLabel: string;
    shareUrl: string;
  };
}
```

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: clean (model is unused yet but valid TS).

- [ ] **Step 3: Commit**

```bash
git add src/modules/pets/domain/models/PetHealthCardViewModel.ts
git commit -m "feat(pets): add PetHealthCardViewModel domain model"
```

---

### Task 4: Implement `BuildPetHealthCardViewModel` use case (TDD)

**Files:**
- Create: `src/modules/pets/domain/usecases/BuildPetHealthCardViewModel.ts`
- Create: `src/modules/pets/domain/usecases/__tests__/BuildPetHealthCardViewModel.test.ts`

The use case takes two simple ports (function dependencies, not classes — matches existing project conventions for testable usecases). Returns a `PetHealthCardViewModel`. Pure: no React, no stores, no async dependency on infra.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/BuildPetHealthCardViewModel.test.ts`:

```ts
import { BuildPetHealthCardViewModel } from '../BuildPetHealthCardViewModel';
import type { Pet } from '../../models/Pet';
import type { SmartHealthRecord } from '../../../../records/domain/models/SmartHealthRecord';

const REF_NOW = new Date('2026-05-11T12:00:00.000Z');

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    userId: 'user-1',
    name: 'Bruno',
    type: 'dog',
    breed: 'Golden Retriever',
    dob: '2024-01-11',
    createdAt: '2024-01-11T00:00:00.000Z',
    updatedAt: '2024-01-11T00:00:00.000Z',
    ...overrides,
  };
}

function makeRecord(overrides: Partial<SmartHealthRecord> = {}): SmartHealthRecord {
  return {
    id: 'rec-1',
    userId: 'user-1',
    petId: 'pet-1',
    type: 'vaccination',
    name: 'DHPP annual',
    dueDate: '2026-05-22',
    completedDate: null,
    status: 'upcoming',
    recurrenceType: 'yearly',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('BuildPetHealthCardViewModel', () => {
  it('returns view model with name, breed, age, items', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({ id: 'r1', name: 'Rabies booster', dueDate: '2026-05-22', status: 'upcoming' }),
        makeRecord({
          id: 'r2', name: 'DHPP annual', status: 'completed',
          completedDate: '2026-03-01', dueDate: '2026-03-01',
        }),
        makeRecord({
          id: 'r3', type: 'deworming', name: 'Deworming', status: 'completed',
          completedDate: '2026-02-01', dueDate: '2026-02-01',
        }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.pet.name).toBe('Bruno');
    expect(vm.pet.breedLabel).toBe('Golden Retriever');
    expect(vm.pet.ageLabel).toBe('2 yrs 4 mo');
    expect(vm.snapshot.kind).toBe('items');
    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items).toHaveLength(3);
    expect(vm.snapshot.items[0]).toEqual({
      label: 'Rabies booster',
      status: 'due_in',
      detail: 'Due in 11 days',
    });
    expect(vm.snapshot.items[1].status).toBe('done');
    expect(vm.snapshot.items[2].status).toBe('done');
  });

  it('marks overdue when due date is in the past', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({ id: 'r1', name: 'Rabies booster', dueDate: '2026-04-01', status: 'overdue' }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items[0].status).toBe('overdue');
    expect(vm.snapshot.items[0].detail).toBe('Overdue');
  });

  it('handles pet with no breed or dob', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet({ breed: undefined, dob: undefined }),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.pet.breedLabel).toBeNull();
    expect(vm.pet.ageLabel).toBeNull();
  });

  it('returns empty snapshot when pet has no records', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    expect(vm.snapshot.kind).toBe('empty');
    if (vm.snapshot.kind !== 'empty') throw new Error();
    expect(vm.snapshot.speciesEmoji).toBe('🐕');
  });

  it('uses cat emoji for cat pets in empty state', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet({ type: 'cat' }),
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'empty') throw new Error();
    expect(vm.snapshot.speciesEmoji).toBe('🐈');
  });

  it('throws when pet is not found', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => null,
      listSmartHealthRecords: async () => [],
      now: () => REF_NOW,
    });

    await expect(
      useCase.execute({ userId: 'user-1', petId: 'missing' }),
    ).rejects.toThrow(/Pet not found/i);
  });

  it('caps snapshot at 3 items: 1 upcoming + 2 most recent completed', async () => {
    const useCase = new BuildPetHealthCardViewModel({
      getPetById: async () => makePet(),
      listSmartHealthRecords: async () => [
        makeRecord({ id: 'r1', name: 'Rabies', dueDate: '2026-05-22', status: 'upcoming' }),
        makeRecord({ id: 'rc1', name: 'DHPP', status: 'completed', completedDate: '2026-03-01', dueDate: '2026-03-01' }),
        makeRecord({ id: 'rc2', name: 'Deworm Feb', type: 'deworming', status: 'completed', completedDate: '2026-02-01', dueDate: '2026-02-01' }),
        makeRecord({ id: 'rc3', name: 'Deworm Jan', type: 'deworming', status: 'completed', completedDate: '2026-01-01', dueDate: '2026-01-01' }),
      ],
      now: () => REF_NOW,
    });

    const vm = await useCase.execute({ userId: 'user-1', petId: 'pet-1' });

    if (vm.snapshot.kind !== 'items') throw new Error();
    expect(vm.snapshot.items.map(i => i.label)).toEqual(['Rabies', 'DHPP', 'Deworm Feb']);
  });
});
```

- [ ] **Step 2: Run tests, confirm failure**

```bash
yarn test src/modules/pets/domain/usecases/__tests__/BuildPetHealthCardViewModel.test.ts
```

Expected: import fails — `BuildPetHealthCardViewModel` does not exist.

- [ ] **Step 3: Implement the use case**

Create `src/modules/pets/domain/usecases/BuildPetHealthCardViewModel.ts`:

```ts
import type { ImageSourcePropType } from 'react-native';

import { images } from '../../../../shared/assets/images';
import { SHARE_INSTALL_URL } from '../../../../shared/constants/releaseBackend';
import type { SmartHealthRecord } from '../../../records/domain/models/SmartHealthRecord';
import type { Pet } from '../models/Pet';
import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
  PetHealthCardViewModel,
} from '../models/PetHealthCardViewModel';
import { formatPetAgeShareLabel } from '../utils/petDobDisplay';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';

const SHARE_URL_DISPLAY = 'paw-fect.vercel.app';
const BRAND_LABEL = '🐾 Paw-fect';
const MAX_ITEMS = 3;
const COMPLETED_WINDOW_DAYS = 365;

export interface BuildPetHealthCardViewModelDeps {
  getPetById: (userId: string, petId: string) => Promise<Pet | null>;
  listSmartHealthRecords: (userId: string, petId: string) => Promise<SmartHealthRecord[]>;
  now?: () => Date;
}

export interface BuildPetHealthCardViewModelInput {
  userId: string;
  petId: string;
}

export class BuildPetHealthCardViewModel {
  constructor(private readonly deps: BuildPetHealthCardViewModelDeps) {}

  async execute(input: BuildPetHealthCardViewModelInput): Promise<PetHealthCardViewModel> {
    const now = this.deps.now ? this.deps.now() : new Date();
    const pet = await this.deps.getPetById(input.userId, input.petId);
    if (!pet) {
      throw new Error(`Pet not found: ${input.petId}`);
    }
    const records = await this.deps.listSmartHealthRecords(input.userId, input.petId);

    const photoSource: ImageSourcePropType = resolvePetAvatarSource({
      type: pet.type,
      photo: pet.photo,
    });

    const breedLabel = pet.breed && pet.breed.trim().length > 0 ? pet.breed.trim() : null;
    const ageLabel = formatPetAgeShareLabel(pet.dob, now);

    const snapshot = buildSnapshot(records, pet.type, now);

    return {
      pet: { name: pet.name, breedLabel, ageLabel, photoSource },
      snapshot,
      footer: {
        urlLabel: SHARE_URL_DISPLAY,
        brandLabel: BRAND_LABEL,
        shareUrl: SHARE_INSTALL_URL,
      },
    };
  }
}

function buildSnapshot(
  records: SmartHealthRecord[],
  petType: Pet['type'],
  now: Date,
): PetHealthCardViewModel['snapshot'] {
  const upcoming = pickNextUpcoming(records);
  const completed = pickRecentCompleted(records, now);

  if (!upcoming && completed.length === 0) {
    return { kind: 'empty', speciesEmoji: petType === 'cat' ? '🐈' : '🐕' };
  }

  const items: PetHealthCardItem[] = [];
  if (upcoming) {
    items.push(buildUpcomingItem(upcoming, now));
  }
  for (const rec of completed) {
    if (items.length >= MAX_ITEMS) break;
    items.push(buildCompletedItem(rec));
  }

  return { kind: 'items', items: items.slice(0, MAX_ITEMS) };
}

function pickNextUpcoming(records: SmartHealthRecord[]): SmartHealthRecord | null {
  const candidates = records
    .filter(r => r.status === 'upcoming' || r.status === 'overdue')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return candidates[0] ?? null;
}

function pickRecentCompleted(records: SmartHealthRecord[], now: Date): SmartHealthRecord[] {
  const cutoff = new Date(now.getTime() - COMPLETED_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return records
    .filter(r => r.status === 'completed')
    .filter(r => {
      const completed = r.completedDate ?? r.dueDate;
      return completed >= cutoffIso;
    })
    .sort((a, b) => {
      const ad = a.completedDate ?? a.dueDate;
      const bd = b.completedDate ?? b.dueDate;
      return bd.localeCompare(ad);
    });
}

function buildUpcomingItem(rec: SmartHealthRecord, now: Date): PetHealthCardItem {
  const due = new Date(`${rec.dueDate}T12:00:00.000Z`);
  const diffDays = Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const status: PetHealthCardItemStatus = diffDays < 0 || rec.status === 'overdue' ? 'overdue' : 'due_in';
  const detail = status === 'overdue'
    ? 'Overdue'
    : diffDays === 0
      ? 'Due today'
      : diffDays === 1
        ? 'Due in 1 day'
        : `Due in ${diffDays} days`;
  return { label: rec.name, status, detail };
}

function buildCompletedItem(rec: SmartHealthRecord): PetHealthCardItem {
  return { label: rec.name, status: 'done', detail: 'Done ✓' };
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
yarn test src/modules/pets/domain/usecases/__tests__/BuildPetHealthCardViewModel.test.ts
```

Expected: all green.

- [ ] **Step 5: Type-check whole project**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/modules/pets/domain/models/PetHealthCardViewModel.ts \
        src/modules/pets/domain/usecases/BuildPetHealthCardViewModel.ts \
        src/modules/pets/domain/usecases/__tests__/BuildPetHealthCardViewModel.test.ts
git commit -m "feat(pets): add BuildPetHealthCardViewModel use case"
```

---

### Task 5: Wire use case into `petComposition`

**Files:**
- Modify: `src/modules/pets/petComposition.ts`

- [ ] **Step 1: Extend the composition**

Add an import at the top and a new exposed helper. The helper consumes the existing pet repository (via `getPetById`) and the smart-health-record store as its records read port (matching the cross-feature pattern already used elsewhere in this file).

Insert imports near existing ones:

```ts
import { BuildPetHealthCardViewModel } from './domain/usecases/BuildPetHealthCardViewModel';
import type { PetHealthCardViewModel } from './domain/models/PetHealthCardViewModel';
```

Add this method inside the `petComposition` const before the closing `} as const`:

```ts
buildPetHealthCard: async (
  userId: string,
  petId: string,
): Promise<PetHealthCardViewModel> => {
  const usecase = new BuildPetHealthCardViewModel({
    getPetById: async (uid, pid) => repository.getPetById(uid, pid),
    listSmartHealthRecords: async (_uid, pid) => {
      await useSmartHealthRecordStore.getState().loadPetRecords(pid);
      return useSmartHealthRecordStore
        .getState()
        .records.filter(r => r.petId === pid);
    },
  });
  return usecase.execute({ userId, petId });
},
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Run all pet + records tests as a regression net**

```bash
yarn test src/modules/pets src/modules/records
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pets/petComposition.ts
git commit -m "feat(pets): wire BuildPetHealthCardViewModel into petComposition"
```

---

## Phase 2 — Card component + share screen

### Task 6: Install `react-native-view-shot`

**Files:**
- Modify: `package.json`, `yarn.lock`
- Modify (auto on pod install): `ios/Podfile.lock`

- [ ] **Step 1: Install**

```bash
yarn add react-native-view-shot
```

- [ ] **Step 2: iOS pods**

```bash
bundle exec pod install --project-directory=ios
```

- [ ] **Step 3: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: clean. (Types ship with the package.)

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock ios/Podfile.lock
git commit -m "build: add react-native-view-shot dep for share card capture"
```

---

### Task 7: Create `PetHealthShareCard` component

Pure presentational component. Fixed 1080×1350 canvas. Renders the view model — no store reads, no business logic.

**Files:**
- Create: `src/modules/pets/ui/components/share/PetHealthShareCard.tsx`
- Create: `src/modules/pets/ui/components/share/PetHealthShareCard.styles.ts`

- [ ] **Step 1: Create the styles file**

`PetHealthShareCard.styles.ts`:

```ts
import { StyleSheet } from 'react-native';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

const HERO_GREEN = '#1a3a2a';
const HERO_BORDER = '#4caf82';
const SUBLINE = '#82c9a8';
const SURFACE = '#ffffff';
const TEXT_PRIMARY = '#101b13';
const TEXT_SECONDARY = '#5a6a60';
const DIVIDER = 'rgba(0,0,0,0.08)';

const CHIP_DUE_BG = '#fff3cd';
const CHIP_DUE_FG = '#7a5800';
const CHIP_DONE_BG = '#d4edda';
const CHIP_DONE_FG = '#1a5e30';
const CHIP_OVERDUE_BG = '#fde0e0';
const CHIP_OVERDUE_FG = '#8a1a1a';

export const shareCardPalette = {
  HERO_GREEN, HERO_BORDER, SUBLINE, SURFACE,
  TEXT_PRIMARY, TEXT_SECONDARY, DIVIDER,
  CHIP_DUE_BG, CHIP_DUE_FG,
  CHIP_DONE_BG, CHIP_DONE_FG,
  CHIP_OVERDUE_BG, CHIP_OVERDUE_FG,
};

export const shareCardStyles = StyleSheet.create({
  root: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: SURFACE,
    borderRadius: 64,
    overflow: 'hidden',
  },
  hero: {
    backgroundColor: HERO_GREEN,
    paddingTop: 88,
    paddingBottom: 56,
    alignItems: 'center',
  },
  avatarRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: HERO_BORDER,
    overflow: 'hidden',
    backgroundColor: '#2e6648',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 120 },
  petName: {
    color: '#ffffff',
    fontSize: 96,
    marginTop: 28,
    textAlign: 'center',
  },
  petSubline: {
    color: SUBLINE,
    fontSize: 36,
    marginTop: 12,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 72,
    paddingVertical: 56,
  },
  sectionLabel: {
    color: TEXT_SECONDARY,
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  rowLabel: {
    color: TEXT_PRIMARY,
    fontSize: 40,
    flexShrink: 1,
    marginRight: 24,
  },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 40,
  },
  chipText: { fontSize: 28 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 140, marginBottom: 24 },
  emptyTitle: {
    color: TEXT_PRIMARY,
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySub: {
    color: TEXT_SECONDARY,
    fontSize: 32,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 72,
    paddingBottom: 56,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerUrl: { color: TEXT_SECONDARY, fontSize: 28 },
  footerBrand: { color: HERO_GREEN, fontSize: 32 },
});
```

- [ ] **Step 2: Create the component**

`PetHealthShareCard.tsx`:

```tsx
import React from 'react';
import { Image, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import type {
  PetHealthCardItem,
  PetHealthCardViewModel,
} from '../../../domain/models/PetHealthCardViewModel';
import {
  shareCardPalette,
  shareCardStyles,
} from './PetHealthShareCard.styles';

export interface PetHealthShareCardProps {
  viewModel: PetHealthCardViewModel;
}

export const PetHealthShareCard: React.FC<PetHealthShareCardProps> = ({ viewModel }) => {
  const { fontFamilies } = useTheme();
  const { pet, snapshot, footer } = viewModel;
  const subline = formatSubline(pet.breedLabel, pet.ageLabel);

  return (
    <View style={shareCardStyles.root} collapsable={false}>
      <View style={shareCardStyles.hero}>
        <View style={shareCardStyles.avatarRing}>
          <Image source={pet.photoSource} style={shareCardStyles.avatarImage} resizeMode="cover" />
        </View>
        <Text style={[shareCardStyles.petName, { fontFamily: fontFamilies.extrabold }]} numberOfLines={1}>
          {pet.name}
        </Text>
        {subline ? (
          <Text style={[shareCardStyles.petSubline, { fontFamily: fontFamilies.medium }]} numberOfLines={1}>
            {subline}
          </Text>
        ) : null}
      </View>

      <View style={shareCardStyles.body}>
        {snapshot.kind === 'items' ? (
          <>
            <Text style={[shareCardStyles.sectionLabel, { fontFamily: fontFamilies.bold }]}>
              HEALTH SNAPSHOT
            </Text>
            {snapshot.items.map(item => (
              <SnapshotRow key={`${item.label}-${item.status}`} item={item} fontFamilies={fontFamilies} />
            ))}
          </>
        ) : (
          <View style={shareCardStyles.emptyWrap}>
            <Text style={shareCardStyles.emptyEmoji}>{snapshot.speciesEmoji}</Text>
            <Text style={[shareCardStyles.emptyTitle, { fontFamily: fontFamilies.bold }]}>
              Just added {pet.name} to Paw-fect 🎉
            </Text>
            <Text style={[shareCardStyles.emptySub, { fontFamily: fontFamilies.medium }]}>
              Auto-scheduled vaccines and deworming.
            </Text>
          </View>
        )}
      </View>

      <View style={shareCardStyles.footer}>
        <Text style={[shareCardStyles.footerUrl, { fontFamily: fontFamilies.medium }]}>
          {footer.urlLabel}
        </Text>
        <Text style={[shareCardStyles.footerBrand, { fontFamily: fontFamilies.bold }]}>
          {footer.brandLabel}
        </Text>
      </View>
    </View>
  );
};

const SnapshotRow: React.FC<{
  item: PetHealthCardItem;
  fontFamilies: { medium: string; bold: string };
}> = ({ item, fontFamilies }) => {
  const palette = chipPalette(item.status);
  return (
    <View style={shareCardStyles.row}>
      <Text
        style={[shareCardStyles.rowLabel, { fontFamily: fontFamilies.medium }]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <View style={[shareCardStyles.chip, { backgroundColor: palette.bg }]}>
        <Text style={[shareCardStyles.chipText, { color: palette.fg, fontFamily: fontFamilies.bold }]}>
          {item.detail}
        </Text>
      </View>
    </View>
  );
};

function chipPalette(status: PetHealthCardItem['status']): { bg: string; fg: string } {
  switch (status) {
    case 'done':
      return { bg: shareCardPalette.CHIP_DONE_BG, fg: shareCardPalette.CHIP_DONE_FG };
    case 'due_in':
      return { bg: shareCardPalette.CHIP_DUE_BG, fg: shareCardPalette.CHIP_DUE_FG };
    case 'overdue':
      return { bg: shareCardPalette.CHIP_OVERDUE_BG, fg: shareCardPalette.CHIP_OVERDUE_FG };
  }
}

function formatSubline(breed: string | null, age: string | null): string | null {
  if (breed && age) return `${breed} · ${age}`;
  return breed ?? age ?? null;
}
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc --noEmit && yarn lint src/modules/pets/ui/components/share
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pets/ui/components/share
git commit -m "feat(pets): add PetHealthShareCard presentational component"
```

---

### Task 8: Create `PetHealthCardShareScreen`

Hosts the off-screen `ViewShot`-wrapped card, the visible scaled-down preview, and the Share button. Reads the view model via `petComposition.buildPetHealthCard`.

**Files:**
- Create: `src/modules/pets/ui/screens/PetHealthCardShareScreen.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';

import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';
import { petComposition } from '../../petComposition';
import type { PetHealthCardViewModel } from '../../domain/models/PetHealthCardViewModel';
import { PetHealthShareCard } from '../components/share/PetHealthShareCard';
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from '../components/share/PetHealthShareCard.styles';
import { logUnexpectedError } from '../../../../shared/utils/logUnexpectedError';

type ParamList = { PetHealthCardShare: { petId: string } };

const PREVIEW_TARGET_WIDTH = 320;
const PREVIEW_SCALE = PREVIEW_TARGET_WIDTH / SHARE_CARD_WIDTH;

export const PetHealthCardShareScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, 'PetHealthCardShare'>>();
  const navigation = useNavigation();
  const { colors, fontFamilies } = useTheme();
  const userId = useAuthStore(s => s.user?.id);
  const viewShotRef = useRef<ViewShot>(null);

  const [viewModel, setViewModel] = useState<PetHealthCardViewModel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        setLoadError('You need to be signed in.');
        return;
      }
      try {
        const vm = await petComposition.buildPetHealthCard(userId, route.params.petId);
        if (!cancelled) setViewModel(vm);
      } catch (err) {
        logUnexpectedError('[PetHealthCardShareScreen] load', err);
        if (!cancelled) setLoadError('Could not load this pet.');
      }
    })();
    return () => { cancelled = true; };
  }, [route.params.petId, userId]);

  const handleShare = useCallback(async () => {
    if (!viewModel || sharing) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) throw new Error('capture returned no uri');
      const message = buildShareMessage(viewModel);
      await Share.share({ url: uri, message });
    } catch (err) {
      logUnexpectedError('[PetHealthCardShareScreen] share', err);
      ToastAndroid.show?.('Couldn’t open share sheet', ToastAndroid.SHORT);
    } finally {
      setSharing(false);
    }
  }, [viewModel, sharing]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: colors.text.heading, fontFamily: fontFamilies.bold }]}>
            ‹ Back
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.heading, fontFamily: fontFamilies.bold }]}>
          Share health card
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.body}>
        {loadError ? (
          <Text style={[styles.error, { color: colors.text.heading, fontFamily: fontFamilies.medium }]}>
            {loadError}
          </Text>
        ) : !viewModel ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.caption, { color: colors.text.body, fontFamily: fontFamilies.medium }]}>
              Looking good?
            </Text>

            <View
              style={[
                styles.previewWrap,
                { width: PREVIEW_TARGET_WIDTH, height: SHARE_CARD_HEIGHT * PREVIEW_SCALE },
              ]}
            >
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                style={[
                  styles.viewShot,
                  {
                    width: SHARE_CARD_WIDTH,
                    height: SHARE_CARD_HEIGHT,
                    transform: [{ scale: PREVIEW_SCALE }],
                  },
                ]}
              >
                <PetHealthShareCard viewModel={viewModel} />
              </ViewShot>
            </View>

            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={[
                styles.shareBtn,
                { backgroundColor: sharing ? colors.borderSubtle : colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share health card"
            >
              {sharing ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={[styles.shareBtnText, { color: colors.text.inverse, fontFamily: fontFamilies.bold }]}>
                  Share
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PetHealthCardShareScreen;

function buildShareMessage(vm: PetHealthCardViewModel): string {
  if (vm.snapshot.kind === 'empty') {
    const species = vm.snapshot.speciesEmoji === '🐈' ? 'cats' : 'dogs';
    return [
      `Just added ${vm.pet.name} to Paw-fect 🐾`,
      `Auto-scheduled vaccines and deworming for ${species}.`,
      `Track your pet’s health: ${vm.footer.shareUrl}`,
    ].join('\n');
  }
  const next = vm.snapshot.items.find(i => i.status !== 'done');
  const nextLine = next ? `Next up: ${next.label} (${next.detail})` : 'On track 💛';
  return [
    `${vm.pet.name} on Paw-fect 🐾`,
    nextLine,
    `Track your pet’s health: ${vm.footer.shareUrl}`,
  ].join('\n');
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { minWidth: 64 },
  headerBtnText: { fontSize: 16 },
  headerTitle: { fontSize: 18 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  caption: { fontSize: 14, marginBottom: 16 },
  previewWrap: {
    overflow: 'hidden',
    borderRadius: 24,
    marginBottom: 32,
  },
  viewShot: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
  },
  shareBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 18 },
  error: { fontSize: 16, textAlign: 'center' },
});
```

> **Note** on `transformOrigin`: if RN 0.84 on Android renders the scaled `ViewShot` off-anchor, swap the wrapper for an absolutely-positioned offscreen render using `position: 'absolute', left: -10000` and remove the transform — capture works the same. Plan a 5-minute manual check on Android during QA (Task 14).

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && yarn lint src/modules/pets/ui/screens/PetHealthCardShareScreen.tsx
```

Expected: clean. May need `logUnexpectedError` — if it doesn't exist at that path, replace with inline `if (__DEV__) console.error(...)` (per `AGENTS.md`).

- [ ] **Step 3: Commit**

```bash
git add src/modules/pets/ui/screens/PetHealthCardShareScreen.tsx
git commit -m "feat(pets): add PetHealthCardShareScreen with ViewShot + share"
```

---

### Task 9: Register the route + nav types

**Files:**
- Modify: `src/app/navigation/types.ts` (or wherever `PetsStackParamList` lives)
- Modify: `src/app/navigation/stacks/PetsStackNavigator.tsx`

- [ ] **Step 1: Extend `PetsStackParamList`**

Open `src/app/navigation/types.ts` and add `PetHealthCardShare: { petId: string }` to `PetsStackParamList`.

- [ ] **Step 2: Register the screen**

Modify `PetsStackNavigator.tsx`:

```tsx
import PetHealthCardShareScreen from '../../../modules/pets/ui/screens/PetHealthCardShareScreen';
// ...
<Stack.Screen name="PetHealthCardShare" component={PetHealthCardShareScreen} />
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/navigation
git commit -m "feat(nav): register PetHealthCardShare route in pets stack"
```

---

### Task 10: Add "Share health card" entry on Pet Profile

Add a button on the Pet Profile screen (near or inside the hero card) that navigates to the share screen for the active pet.

**Files:**
- Modify: `src/modules/pets/ui/screens/PetProfileScreen.tsx`

- [ ] **Step 1: Add nav handler + button**

In `PetProfileScreen.tsx`, near the existing `goEditPet` callback, add:

```tsx
const goShareHealthCard = useCallback(() => {
  if (!petId) return;
  navigation.navigate('PetHealthCardShare', { petId });
}, [navigation, petId]);
```

Below the existing `<PetProfileHeroCard ... />` block, insert a small CTA strip:

```tsx
<Pressable
  onPress={goShareHealthCard}
  disabled={!petId}
  style={({ pressed }) => [
    {
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radiusTokens.lg,
      backgroundColor: colors.primary,
      opacity: pressed ? 0.85 : 1,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
  ]}
  accessibilityRole="button"
  accessibilityLabel="Share health card"
>
  <MaterialIcon name="ios-share" size={18} color={colors.text.inverse} />
  <AppText
    style={[
      textStyles.control,
      { color: colors.text.inverse, fontFamily: fontFamilies.bold, marginLeft: spacing.xs },
    ]}
  >
    Share health card
  </AppText>
</Pressable>
```

(Adjust icon name to whatever the existing `MaterialIcon` supports — `share`, `share-variant`, etc.)

- [ ] **Step 2: Type-check + manual smoke**

```bash
npx tsc --noEmit
```

Tap the button on a running app, confirm navigation works and the card renders.

- [ ] **Step 3: Commit**

```bash
git add src/modules/pets/ui/screens/PetProfileScreen.tsx
git commit -m "feat(pets): add Share health card entry on Pet Profile"
```

---

## Phase 3 — Post-task celebration modal

### Task 11: `isMilestoneCompletion` helper (TDD)

**Files:**
- Create: `src/modules/records/domain/utils/isMilestoneCompletion.ts`
- Create: `src/modules/records/domain/utils/__tests__/isMilestoneCompletion.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { isMilestoneCompletion, type MilestoneKind } from '../isMilestoneCompletion';
import type { SmartHealthRecord } from '../../models/SmartHealthRecord';

function record(o: Partial<SmartHealthRecord> = {}): SmartHealthRecord {
  return {
    id: 'r', userId: 'u', petId: 'p',
    type: 'vaccination', name: 'X',
    dueDate: '2026-05-22', completedDate: '2026-05-11',
    status: 'completed', recurrenceType: 'yearly',
    createdAt: '', updatedAt: '',
    ...o,
  };
}

describe('isMilestoneCompletion', () => {
  it('detects final dose of a series', () => {
    const completed = record({ doseNumber: 3, totalDoses: 3, family: 'DHPP' });
    const all: SmartHealthRecord[] = [
      record({ id: 'a', doseNumber: 1, totalDoses: 3, family: 'DHPP', status: 'completed', completedDate: '2026-01-01' }),
      record({ id: 'b', doseNumber: 2, totalDoses: 3, family: 'DHPP', status: 'completed', completedDate: '2026-03-01' }),
      completed,
    ];
    const result = isMilestoneCompletion(completed, all);
    expect(result).toEqual<{ kind: MilestoneKind } | null>({ kind: 'series_complete' });
  });

  it('returns null for a mid-series dose', () => {
    const completed = record({ doseNumber: 2, totalDoses: 3, family: 'DHPP' });
    expect(isMilestoneCompletion(completed, [completed])).toBeNull();
  });

  it('detects a rabies booster', () => {
    const completed = record({ family: 'Rabies', name: 'Rabies booster' });
    expect(isMilestoneCompletion(completed, [completed])).toEqual({ kind: 'rabies_booster' });
  });

  it('detects the first-ever completed record for a pet', () => {
    const completed = record({ id: 'r1' });
    expect(isMilestoneCompletion(completed, [completed])).toEqual({ kind: 'first_ever' });
  });

  it('returns null for adult deworming with prior completions', () => {
    const completed = record({ id: 'r2', type: 'deworming', name: 'Deworming', family: undefined });
    const all: SmartHealthRecord[] = [
      record({ id: 'r1', type: 'deworming', name: 'Deworming', status: 'completed', completedDate: '2025-12-01' }),
      completed,
    ];
    expect(isMilestoneCompletion(completed, all)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, confirm failure**

```bash
yarn test src/modules/records/domain/utils/__tests__/isMilestoneCompletion.test.ts
```

Expected: import error.

- [ ] **Step 3: Implement the helper**

```ts
import type { SmartHealthRecord } from '../models/SmartHealthRecord';

export type MilestoneKind = 'series_complete' | 'rabies_booster' | 'first_ever';

export interface MilestoneResult {
  kind: MilestoneKind;
}

export function isMilestoneCompletion(
  completed: SmartHealthRecord,
  allForPet: SmartHealthRecord[],
): MilestoneResult | null {
  if (completed.status !== 'completed') return null;

  if (
    typeof completed.doseNumber === 'number' &&
    typeof completed.totalDoses === 'number' &&
    completed.totalDoses > 1 &&
    completed.doseNumber === completed.totalDoses
  ) {
    return { kind: 'series_complete' };
  }

  if (completed.family && completed.family.toLowerCase() === 'rabies') {
    return { kind: 'rabies_booster' };
  }

  const completedCountIncludingThis = allForPet.filter(
    r => r.status === 'completed',
  ).length;
  if (completedCountIncludingThis === 1) {
    return { kind: 'first_ever' };
  }

  return null;
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
yarn test src/modules/records/domain/utils/__tests__/isMilestoneCompletion.test.ts
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/modules/records/domain/utils/isMilestoneCompletion.ts \
        src/modules/records/domain/utils/__tests__/isMilestoneCompletion.test.ts
git commit -m "feat(records): add isMilestoneCompletion helper"
```

---

### Task 12: Wire milestone event queue into `smartHealthRecordStore`

Add a tiny in-memory queue to the store that `markAsDone` writes to after a successful completion, when `isMilestoneCompletion` returns a kind. A subscribe API lets UI consumers drain.

**Files:**
- Modify: `src/modules/records/store/smartHealthRecordStore.ts`

- [ ] **Step 1: Add the queue + subscribe API**

Inside the store creator, add new state + actions:

```ts
interface MilestoneEvent {
  petId: string;
  recordId: string;
  kind: 'series_complete' | 'rabies_booster' | 'first_ever';
}

// In the state interface, add:
milestoneEvents: MilestoneEvent[];
consumeMilestoneEvent: () => MilestoneEvent | undefined;
```

In the slice implementation:

```ts
milestoneEvents: [],
consumeMilestoneEvent: () => {
  const queue = get().milestoneEvents;
  if (queue.length === 0) return undefined;
  const [head, ...rest] = queue;
  set({ milestoneEvents: rest });
  return head;
},
```

- [ ] **Step 2: Publish from `markAsDone`**

In the existing `markAsDone` action, after the successful `await recordsComposition.markSmartHealthRecordDone.execute(...)` call and the resulting state refresh, compute and enqueue:

```ts
import { isMilestoneCompletion } from '../domain/utils/isMilestoneCompletion';
// ...
const refreshed = get().records.find(r => r.id === recordId);
if (refreshed && refreshed.status === 'completed') {
  const milestone = isMilestoneCompletion(
    refreshed,
    get().records.filter(r => r.petId === refreshed.petId),
  );
  if (milestone) {
    set({
      milestoneEvents: [
        ...get().milestoneEvents,
        { petId: refreshed.petId, recordId: refreshed.id, kind: milestone.kind },
      ],
    });
  }
}
```

(Adapt to the existing post-completion update sequence in the store — the key is: after state has the completed record, emit.)

- [ ] **Step 3: Verify type-check + run records tests**

```bash
npx tsc --noEmit && yarn test src/modules/records
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/modules/records/store/smartHealthRecordStore.ts
git commit -m "feat(records): emit milestone events from smartHealthRecordStore"
```

---

### Task 13: `ShareMomentModal` component

**Files:**
- Create: `src/modules/app/ui/components/celebration/ShareMomentModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import type { MilestoneKind } from '../../../../records/domain/utils/isMilestoneCompletion';

export interface ShareMomentModalProps {
  visible: boolean;
  petName: string;
  kind: MilestoneKind;
  onShare: () => void;
  onDismiss: () => void;
}

function headlineFor(kind: MilestoneKind, petName: string): string {
  switch (kind) {
    case 'series_complete':
      return `${petName} just completed the series 🎉`;
    case 'rabies_booster':
      return `${petName} is fully covered against rabies 🛡️`;
    case 'first_ever':
      return `${petName} is on track 💛`;
  }
}

export const ShareMomentModal: React.FC<ShareMomentModalProps> = ({
  visible, petName, kind, onShare, onDismiss,
}) => {
  const { colors, fontFamilies, radius, spacing } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl }]}>
          <Text style={[styles.title, { color: colors.text.heading, fontFamily: fontFamilies.extrabold }]}>
            {headlineFor(kind, petName)}
          </Text>
          <Text style={[styles.sub, { color: colors.text.body, fontFamily: fontFamilies.medium, marginTop: spacing.sm }]}>
            Share this moment so other pet parents see how easy it is.
          </Text>
          <Pressable
            onPress={onShare}
            style={[styles.primary, { backgroundColor: colors.primary, marginTop: spacing.xl, borderRadius: radius.pill }]}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryText, { color: colors.text.inverse, fontFamily: fontFamilies.bold }]}>
              Share this moment
            </Text>
          </Pressable>
          <Pressable onPress={onDismiss} style={styles.secondary} accessibilityRole="button">
            <Text style={[styles.secondaryText, { color: colors.text.body, fontFamily: fontFamilies.medium }]}>
              Not now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: { alignItems: 'stretch' },
  title: { fontSize: 22, textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center' },
  primary: { paddingVertical: 14, alignItems: 'center' },
  primaryText: { fontSize: 16 },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontSize: 14 },
});
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && yarn lint src/modules/app/ui/components/celebration
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/ui/components/celebration/ShareMomentModal.tsx
git commit -m "feat(app): add ShareMomentModal celebration component"
```

---

### Task 14: App-shell hook that drains milestone events + mounts the modal

A small hook that subscribes to `useSmartHealthRecordStore`'s `milestoneEvents`, dedups by petId per JS session, mounts `ShareMomentModal`, and on "Share" navigates to the share screen.

**Files:**
- Create: `src/modules/app/ui/components/celebration/useMilestoneCelebrations.tsx`
- Modify: `src/app/navigation/RootNavigator.tsx` (mount the hook + modal once at root)

- [ ] **Step 1: Create the hook**

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useSmartHealthRecordStore } from '../../../records/store/smartHealthRecordStore';
import { usePetStore } from '../../../pets/store/petStore';
import { ShareMomentModal } from './ShareMomentModal';
import type { MilestoneKind } from '../../../records/domain/utils/isMilestoneCompletion';

export const useMilestoneCelebrations: React.FC = () => {
  const navigation = useNavigation<any>();
  const pets = usePetStore(s => s.pets);
  const queue = useSmartHealthRecordStore(s => s.milestoneEvents);
  const consume = useSmartHealthRecordStore(s => s.consumeMilestoneEvent);
  const shownThisSession = useRef<Set<string>>(new Set());

  const [active, setActive] = useState<{ petId: string; petName: string; kind: MilestoneKind } | null>(null);

  useEffect(() => {
    if (active || queue.length === 0) return;
    const next = consume();
    if (!next) return;
    if (shownThisSession.current.has(next.petId)) return;
    const pet = pets.find(p => p.id === next.petId);
    if (!pet) return;
    shownThisSession.current.add(next.petId);
    setActive({ petId: next.petId, petName: pet.name, kind: next.kind });
  }, [queue, active, consume, pets]);

  const handleShare = useCallback(() => {
    if (!active) return;
    const petId = active.petId;
    setActive(null);
    navigation.navigate('PetsTab', {
      screen: 'PetHealthCardShare',
      params: { petId },
    });
  }, [active, navigation]);

  const handleDismiss = useCallback(() => setActive(null), []);

  if (!active) return null;
  return (
    <ShareMomentModal
      visible
      petName={active.petName}
      kind={active.kind}
      onShare={handleShare}
      onDismiss={handleDismiss}
    />
  );
};
```

- [ ] **Step 2: Mount it at the navigation root**

In `RootNavigator.tsx`, render `<MilestoneCelebrations />` inside the `<NavigationContainer>` tree (above or below the navigator — just inside the container so it has access to navigation context):

```tsx
import { useMilestoneCelebrations as MilestoneCelebrations } from '../../modules/app/ui/components/celebration/useMilestoneCelebrations';
// ... inside the rendered JSX, after the navigator children:
<MilestoneCelebrations />
```

- [ ] **Step 3: Type-check + lint**

```bash
npx tsc --noEmit && yarn lint src/modules/app/ui/components/celebration src/app/navigation/RootNavigator.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/modules/app/ui/components/celebration src/app/navigation/RootNavigator.tsx
git commit -m "feat(app): mount milestone celebration modal at navigation root"
```

---

## Phase 4 — Verification & QA

### Task 15: Manual QA pass

Run through every edge case from spec §7 in order. Use a real iOS device + an Android emulator.

- [ ] **Step 1: Happy path — Pet with photo, breed, dob, full health record**
  - Open Pet Profile → tap "Share health card" → preview renders → tap "Share" → system sheet opens → cancel → no crash.
  - Repeat → tap a real target (e.g. WhatsApp) → confirm image plus caption text both appear.

- [ ] **Step 2: Empty state — Add a new pet, no records yet**
  - Confirm the empty-state copy ("Just added X to Paw-fect 🎉") renders.
  - Confirm sharing still works.

- [ ] **Step 3: Missing data variants**
  - Pet with no photo → emoji circle visible.
  - Pet with no dob → no age line.
  - Pet with no breed → no breed segment.
  - Pet with neither → only name in hero.

- [ ] **Step 4: Overdue**
  - Backdate a smart record to be overdue → status chip reads "Overdue" in red.

- [ ] **Step 5: Celebration modal — each kind**
  - Complete the final dose of a series → modal "X just completed the series".
  - Complete a Rabies booster → modal "X is fully covered against rabies".
  - Complete the first-ever record on a fresh pet → modal "X is on track".
  - Tap "Share this moment" → navigates to share screen for the right pet.
  - Complete a second milestone for the same pet in the same session → no second modal (dedup verified).

- [ ] **Step 6: Type-check + lint sweep**

```bash
npx tsc --noEmit && yarn lint
```

- [ ] **Step 7: Full test suite**

```bash
yarn test
```

Expected: green.

- [ ] **Step 8: Tag the feature complete**

No code change, just a final commit if any QA tweaks were needed:

```bash
git status   # verify clean
```

---

## Spec coverage self-check

| Spec section | Plan task(s) |
|---|---|
| §3.1 Pet Profile entry | Task 10 |
| §3.2 Celebration modal triggers | Task 11 (logic), Task 12 (emit), Task 13 (UI), Task 14 (mount) |
| §3.3 Share screen | Task 8 |
| §4 Visual spec | Task 7 |
| §5.1 New files | Tasks 3, 4, 7, 8, 11, 13, 14 |
| §5.2 Modified files | Tasks 1, 2, 5, 9, 10, 12, 14 |
| §5.3 New dependency | Task 6 |
| §6.1 ViewModel shape | Task 3 |
| §6.2 Use case logic | Task 4 |
| §6.3 Snapshot ordering | Task 4 (tested explicitly) |
| §6.4 Event queue + dedup | Tasks 12, 14 |
| §6.5 Milestone rules | Task 11 |
| §6.6 Share message strings | Task 8 (`buildShareMessage`) |
| §6.7 Capture params | Task 8 (ViewShot options) |
| §7 Error / edge handling | Tasks 4, 7, 8, 15 |
| §8 Tests | Tasks 1, 4, 11 |
| §9 Privacy | All — no raw dob, no notes, no PII passes the use case boundary (enforced by `PetHealthCardViewModel` shape in Task 3) |
| §10 Effort | Phases 1–4 map to the 4 days |
| §11 Forward-compat | Task 3 (separate `urlLabel` / `shareUrl`), Task 2 (`SHARE_INSTALL_URL` is the single swap point for v1.1) |
