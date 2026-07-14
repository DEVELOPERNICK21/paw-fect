# Interactive Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Pawfect onboarding into a 4-step interactive flow (demo taps + motion + persisted care interests) using existing theme tokens and settings storage.

**Architecture:** Keep a single `OnboardingScreen`. Demo selections stay in React state. Care interests persist via `Settings.careInterests` through `useSettingsStore` → `UpdateSettings` → local storage. Step transitions use React Native `Animated` (no Reanimated). Extract pure toggle helpers + a step-4 presentational component so the screen stays maintainable.

**Tech Stack:** React Native 0.84, TypeScript, Zustand settings store, PostHog, Jest, `useTheme()` design tokens.

**Spec:** `docs/superpowers/specs/2026-07-15-interactive-onboarding-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/modules/settings/domain/models/Settings.ts` | Add `CareInterest` type + `careInterests` field |
| `src/modules/settings/data/datasources/SettingsLocalDataSource.ts` | Default `careInterests: []` (merge already spreads defaults) |
| `src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts` | Prove defaults + legacy merge |
| `src/modules/app/ui/onboarding/careInterestUtils.ts` | Pure toggle / label helpers |
| `src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts` | Unit tests for toggle |
| `src/modules/app/ui/components/OnboardingCareInterestsStep.tsx` | Step 4 UI (chips + copy) |
| `src/modules/app/ui/screens/OnboardingScreen.tsx` | Paging, demo taps, motion, complete/skip wiring |

---

### Task 1: Extend Settings model with `careInterests`

**Files:**
- Modify: `src/modules/settings/domain/models/Settings.ts`
- Modify: `src/modules/settings/data/datasources/SettingsLocalDataSource.ts`
- Create: `src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts`:

```typescript
import { createSettingsLocalDataSource } from '../SettingsLocalDataSource';
import { storageService } from '../../../../../infrastructure/storage/storageService';

jest.mock('../../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockGetItem = storageService.getItem as jest.Mock;
const mockSetItem = storageService.setItem as jest.Mock;

describe('SettingsLocalDataSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default careInterests empty array when nothing stored', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual([]);
    expect(settings.onboardingCompleted).toBe(false);
  });

  it('fills careInterests when loading legacy settings without the field', async () => {
    mockGetItem.mockResolvedValueOnce({
      notificationsEnabled: true,
      emailUpdates: false,
      onboardingCompleted: true,
      themeMode: 'dark',
    });
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual([]);
    expect(settings.emailUpdates).toBe(false);
    expect(settings.themeMode).toBe('dark');
  });

  it('preserves stored careInterests', async () => {
    mockGetItem.mockResolvedValueOnce({
      notificationsEnabled: true,
      emailUpdates: true,
      onboardingCompleted: true,
      themeMode: 'system',
      careInterests: ['vaccines', 'walks'],
    });
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual(['vaccines', 'walks']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts`

Expected: FAIL (TypeScript/runtime — `careInterests` missing from `Settings` / defaults)

- [ ] **Step 3: Update the Settings model**

Replace `src/modules/settings/domain/models/Settings.ts` with:

```typescript
export type ThemePreference = 'light' | 'dark' | 'system';

export type CareInterest = 'vaccines' | 'walks' | 'meds' | 'grooming';

export interface Settings {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  onboardingCompleted: boolean;
  themeMode: ThemePreference;
  careInterests: CareInterest[];
}
```

- [ ] **Step 4: Update local defaults**

In `src/modules/settings/data/datasources/SettingsLocalDataSource.ts`, set:

```typescript
const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  emailUpdates: true,
  onboardingCompleted: false,
  themeMode: 'system',
  careInterests: [],
};
```

Also export `DEFAULT_SETTINGS` only if tests need it; prefer testing via `createSettingsLocalDataSource` (no export required).

- [ ] **Step 5: Fix OnboardingScreen fallback object**

In `src/modules/app/ui/screens/OnboardingScreen.tsx`, inside `completeOnboarding`, the fallback `current` settings object must include `careInterests: []` so it type-checks:

```typescript
const current = settings ?? {
  notificationsEnabled: true,
  emailUpdates: true,
  onboardingCompleted: false,
  themeMode: 'system' as const,
  careInterests: [],
};
```

(Do not change completion behavior yet beyond the new field — Task 4 will wire selected interests.)

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
yarn test src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts
npx tsc --noEmit
```

Expected: tests PASS; `tsc` clean (or only pre-existing unrelated errors — fix any new `Settings` breakages by adding `careInterests: []` at call sites that construct full `Settings` objects).

- [ ] **Step 7: Commit**

```bash
git add src/modules/settings/domain/models/Settings.ts \
  src/modules/settings/data/datasources/SettingsLocalDataSource.ts \
  src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts \
  src/modules/app/ui/screens/OnboardingScreen.tsx
git commit -m "$(cat <<'EOF'
feat(settings): add careInterests to settings model

Support onboarding preference persistence with backward-compatible defaults.
EOF
)"
```

---

### Task 2: Care interest toggle helpers

**Files:**
- Create: `src/modules/app/ui/onboarding/careInterestUtils.ts`
- Create: `src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import {
  CARE_INTEREST_OPTIONS,
  toggleCareInterest,
} from '../careInterestUtils';
import type { CareInterest } from '../../../../settings/domain/models/Settings';

describe('toggleCareInterest', () => {
  it('adds an interest when missing', () => {
    const next = toggleCareInterest([], 'vaccines');
    expect(next).toEqual(['vaccines']);
  });

  it('removes an interest when present', () => {
    const current: CareInterest[] = ['vaccines', 'walks'];
    expect(toggleCareInterest(current, 'vaccines')).toEqual(['walks']);
  });

  it('does not mutate the original array', () => {
    const current: CareInterest[] = ['meds'];
    const next = toggleCareInterest(current, 'grooming');
    expect(current).toEqual(['meds']);
    expect(next).toEqual(['meds', 'grooming']);
  });

  it('exposes four labeled options', () => {
    expect(CARE_INTEREST_OPTIONS.map(o => o.id)).toEqual([
      'vaccines',
      'walks',
      'meds',
      'grooming',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement helpers**

Create `src/modules/app/ui/onboarding/careInterestUtils.ts`:

```typescript
import type { CareInterest } from '../../../settings/domain/models/Settings';

export type CareInterestOption = {
  id: CareInterest;
  label: string;
};

export const CARE_INTEREST_OPTIONS: CareInterestOption[] = [
  { id: 'vaccines', label: 'Vaccines' },
  { id: 'walks', label: 'Walks' },
  { id: 'meds', label: 'Meds' },
  { id: 'grooming', label: 'Grooming' },
];

export const toggleCareInterest = (
  current: CareInterest[],
  interest: CareInterest,
): CareInterest[] => {
  if (current.includes(interest)) {
    return current.filter(item => item !== interest);
  }
  return [...current, interest];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/app/ui/onboarding/careInterestUtils.ts \
  src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): add care interest toggle helpers

Provide pure multi-select helpers for the onboarding prefs step.
EOF
)"
```

---

### Task 3: Care interests step component

**Files:**
- Create: `src/modules/app/ui/components/OnboardingCareInterestsStep.tsx`

- [ ] **Step 1: Implement presentational step**

Create `src/modules/app/ui/components/OnboardingCareInterestsStep.tsx` that:

- Accepts `selected: CareInterest[]`, `onToggle: (id: CareInterest) => void`, and scaling helper props if needed (`sv?: (n: number) => number`)
- Uses `useTheme()` for `colors`, `fontFamilies`, `spacing`, `radius`
- Renders title “What do you care about most?”, short subtitle, and `CARE_INTEREST_OPTIONS` as pressable chips
- Selected chip style: `backgroundColor: colors.accent`, text `colors.text.inverse`
- Unselected: `backgroundColor: colors.brandTint5`, border `colors.brandTint20`, text `colors.text.heading`
- Named export `OnboardingCareInterestsStep`

Skeleton:

```typescript
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { CareInterest } from '../../../settings/domain/models/Settings';
import { CARE_INTEREST_OPTIONS } from '../onboarding/careInterestUtils';

type Props = {
  selected: CareInterest[];
  onToggle: (interest: CareInterest) => void;
};

export const OnboardingCareInterestsStep: React.FC<Props> = ({
  selected,
  onToggle,
}) => {
  const { colors, fontFamilies, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
        What do you care about most?
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
        Pick the reminders that matter — you can change focus anytime by building your routine.
      </Text>
      <View style={styles.chips}>
        {CARE_INTEREST_OPTIONS.map(option => {
          const isSelected = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    fontFamily: fontFamilies.bold,
                    color: isSelected
                      ? colors.text.inverse
                      : colors.text.heading,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = ({
  colors,
  spacing,
  radius,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
}) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.75,
    },
    subtitle: {
      marginTop: spacing.md,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.body,
      textAlign: 'center',
    },
    chips: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipIdle: {
      backgroundColor: colors.brandTint5,
      borderColor: colors.brandTint20,
    },
    chipLabel: {
      fontSize: 14,
      lineHeight: 20,
    },
  });
```

- [ ] **Step 2: Lint the new file**

Run: `yarn eslint src/modules/app/ui/components/OnboardingCareInterestsStep.tsx`

Expected: clean (fix import order / any issues)

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/ui/components/OnboardingCareInterestsStep.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): add care interests step UI

Present theme-token multi-select chips for onboarding prefs.
EOF
)"
```

---

### Task 4: Wire interactive onboarding screen

**Files:**
- Modify: `src/modules/app/ui/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Add local interactive state**

Near existing `step` state, add:

```typescript
const TOTAL_STEPS = 4;
type HealthChip = 'Activity' | 'Nutrition' | 'Vitals';
type ReminderDemo = 'vaccination' | 'grooming' | 'walks' | 'meds' | null;
type PetDemo = 'luna' | 'milo' | 'add' | null;

const [selectedHealthChip, setSelectedHealthChip] = useState<HealthChip | null>(null);
const [selectedReminder, setSelectedReminder] = useState<ReminderDemo>(null);
const [selectedPetDemo, setSelectedPetDemo] = useState<PetDemo>(null);
const [careInterests, setCareInterests] = useState<CareInterest[]>([]);
```

Import `CareInterest`, `toggleCareInterest`, and `OnboardingCareInterestsStep`.

- [ ] **Step 2: Update analytics + completion**

```typescript
useEffect(() => {
  posthog.capture('onboarding_step_viewed', {
    step: step + 1,
    total_steps: TOTAL_STEPS,
  });
}, [posthog, step]);

const completeOnboarding = useCallback(
  (skipped = false) => {
    posthog.capture('onboarding_completed', {
      skipped,
      care_interests: careInterests,
    });
    const current = settings ?? {
      notificationsEnabled: true,
      emailUpdates: true,
      onboardingCompleted: false,
      themeMode: 'system' as const,
      careInterests: [],
    };
    // Persist draft selections (may be [] when skipped with none chosen).
    updateSettings({
      ...current,
      onboardingCompleted: true,
      careInterests,
    });
  },
  [careInterests, posthog, settings, updateSettings],
);
```

- [ ] **Step 3: Primary action + CTA gating**

```typescript
const handlePrimaryAction = useCallback(() => {
  if (step < TOTAL_STEPS - 1) {
    setStep(prev => prev + 1);
    return;
  }
  if (careInterests.length === 0) {
    return;
  }
  completeOnboarding(false);
}, [careInterests.length, completeOnboarding, step]);

const primaryDisabled = step === TOTAL_STEPS - 1 && careInterests.length === 0;

const primaryLabel =
  step === 0
    ? 'Get Started →'
    : step < TOTAL_STEPS - 1
      ? 'Next →'
      : 'Save & Continue →';
```

Disable the primary `Pressable` when `primaryDisabled` (`disabled={primaryDisabled}` and reduce opacity via style).

- [ ] **Step 4: Make steps 0–2 tap targets**

- Step 0 feature chips: wrap each in `Pressable`; selected chip uses accent border / `brandTint20` fill
- Step 1 reminder cards + feature rows: `Pressable`; selected uses `borderColor: colors.accent`
- Step 2 pet cards + add card: `Pressable`; selected border accent (Add New is visual-only — do not navigate to Add Pet)

Keep existing images/copy; only add selection chrome.

- [ ] **Step 5: Render step 3 care interests**

When `step === 3`, render:

```tsx
<OnboardingCareInterestsStep
  selected={careInterests}
  onToggle={id => setCareInterests(prev => toggleCareInterest(prev, id))}
/>
```

Update progress UI for all steps > 0 to show `step + 1` of `TOTAL_STEPS` and fill width `((step + 1) / TOTAL_STEPS) * 100%` (replace hard-coded two-thirds / full).

Update dots row on step 0 to map `[0,1,2,3]` or show progress consistently on every step (prefer progress bar on steps ≥1 and dots only on step 0 updated to 4 dots).

- [ ] **Step 6: Add light motion on step change**

Use RN `Animated`:

```typescript
const fade = useRef(new Animated.Value(1)).current;

useEffect(() => {
  fade.setValue(0);
  Animated.timing(fade, {
    toValue: 1,
    duration: 220,
    useNativeDriver: true,
  }).start();
}, [fade, step]);
```

Wrap the step content in `<Animated.View style={{ opacity: fade }}>` (inside ScrollView content). Do **not** add Reanimated.

- [ ] **Step 7: Manual typecheck + lint**

```bash
npx tsc --noEmit
yarn eslint src/modules/app/ui/screens/OnboardingScreen.tsx src/modules/app/ui/components/OnboardingCareInterestsStep.tsx
yarn test src/modules/settings/data/datasources/__tests__/SettingsLocalDataSource.test.ts src/modules/app/ui/onboarding/__tests__/careInterestUtils.test.ts
```

Expected: all pass / clean for touched files.

- [ ] **Step 8: Commit**

```bash
git add src/modules/app/ui/screens/OnboardingScreen.tsx \
  src/modules/app/ui/components/OnboardingCareInterestsStep.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): make onboarding interactive with care prefs

Add demo taps, step motion, a fourth care-interests step, and settings persistence.
EOF
)"
```

---

### Task 5: Manual verification checklist

**Files:** none (manual)

- [ ] **Step 1: Reset onboarding for testing**

In the app (or via debugger), set settings `onboardingCompleted: false` so the flow appears. Alternatively temporarily force the gate in `RootNavigator` only while testing — prefer clearing storage key `settings` on a debug build.

- [ ] **Step 2: Walk the happy path (light mode)**

1. Open onboarding  
2. Tap Health chips → highlight changes  
3. Next → Reminder cards highlight on tap  
4. Next → Pet cards highlight on tap (no real pet created)  
5. Next → Care interests: primary disabled until one chip selected  
6. Select ≥1 → Save & Continue → leaves onboarding  
7. Restart app → stays out of onboarding; `careInterests` still saved (inspect via temporary log or settings storage)

- [ ] **Step 3: Skip path**

Repeat entry; skip early → completes with possibly empty `careInterests`; app enters main flow.

- [ ] **Step 4: Dark mode**

Toggle theme to dark (or system dark); confirm accent chips/borders readable on `backgroundAlt` / `surface`.

- [ ] **Step 5: Final commit if any polish**

Only if manual QA found small token/spacing fixes:

```bash
git add -u
git commit -m "$(cat <<'EOF'
fix(onboarding): polish interactive onboarding after QA

EOF
)"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| 4 steps, single screen | Task 4 |
| Horizontal/step motion via RN Animated | Task 4 Step 6 |
| Demo taps steps 1–3 | Task 4 Step 4 |
| Care interests persisted | Task 1 + Task 4 Step 2 |
| Theme tokens / dark mode | Task 3 + Task 5 |
| PostHog `total_steps: 4` + `care_interests` | Task 4 Step 2 |
| Skip with empty interests | Task 4 Step 2 / Task 5 |
| CTA disabled until ≥1 interest | Task 4 Step 3 |
| No Reanimated / no real pet create / no Firebase sync | Explicit non-goals across tasks |
| Tests for defaults + toggle | Task 1 + Task 2 |

## Placeholder scan

No TBD / “add validation later” steps. Persistence rule for skip is explicit: write current draft `careInterests` (may be `[]`).
