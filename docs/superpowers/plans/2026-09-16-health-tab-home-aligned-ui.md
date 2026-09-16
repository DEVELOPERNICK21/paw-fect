# Health Tab Home-Aligned UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Health Records (Shots / Worm medicine) so chrome and cards match Home — brand-tint hero well, pill tabs, home-style action cards — without changing Smart Health domain behavior.

**Architecture:** UI-only. Extract a focused `HealthHeroBar` for the tint well + pet context + pill tabs. Restyle `SmartHealthRecordItem` to Home “Needs action” card language. Wire labels/padding in `HealthRecordScreen`. Stores, engines, and modals stay as-is.

**Tech Stack:** React Native, TypeScript, existing theme tokens (`useTheme`), `resolvePetAvatarSource`, MaterialIcon / shared icons

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-16-health-tab-home-aligned-ui-design.md`
- Theme tokens only — no hardcoded hex colors
- Primary CTA copy: **I did this** (kid-simple)
- Section titles: **Do next**, **Coming up**, **History** (sentence case, not ALL CAPS overlines)
- No engine / store / Firestore / template changes
- No Approach 3 dashboard rebuild (no horizontal carousels on Health)
- Commit steps only when the user explicitly asks for commits

## File map

| File | Responsibility |
| --- | --- |
| `src/modules/records/ui/components/healthRecordCardSurface.ts` | Pure helper: card background from status + hero |
| `src/modules/records/ui/components/__tests__/healthRecordCardSurface.test.ts` | Unit tests for surface mapping |
| `src/modules/records/ui/components/HealthHeroBar.tsx` | Brand-tint well: back, pet avatar, titles, pill tabs |
| `src/modules/records/ui/components/SmartHealthRecordItem.tsx` | Home-aligned card UI |
| `src/modules/records/ui/screens/HealthRecordScreen.tsx` | Compose hero + list; section titles; body padding |

---

### Task 1: Card surface helper (testable SSOT for tint/danger)

**Files:**
- Create: `src/modules/records/ui/components/healthRecordCardSurface.ts`
- Create: `src/modules/records/ui/components/__tests__/healthRecordCardSurface.test.ts`
- Consumes: `SmartHealthRecordStatus` from `../../domain/models/SmartHealthRecord`
- Produces: `resolveHealthRecordCardSurface({ status, isHero, colors }) => string`

- [ ] **Step 1: Write failing tests**

```typescript
import { resolveHealthRecordCardSurface } from '../healthRecordCardSurface';
import type { AppColors } from '../../../../../shared/theme/colors';

const colors = {
  brandTint12: 'brandTint12',
  dangerSurface: 'dangerSurface',
  surface: 'surface',
} as unknown as AppColors;

describe('resolveHealthRecordCardSurface', () => {
  it('uses dangerSurface for overdue and missed', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'overdue',
        isHero: true,
        colors,
      }),
    ).toBe('dangerSurface');
    expect(
      resolveHealthRecordCardSurface({
        status: 'missed',
        isHero: false,
        colors,
      }),
    ).toBe('dangerSurface');
  });

  it('uses brandTint12 for hero upcoming', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'upcoming',
        isHero: true,
        colors,
      }),
    ).toBe('brandTint12');
  });

  it('uses surface for non-hero upcoming and completed', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'upcoming',
        isHero: false,
        colors,
      }),
    ).toBe('surface');
    expect(
      resolveHealthRecordCardSurface({
        status: 'completed',
        isHero: false,
        colors,
      }),
    ).toBe('surface');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn test -- src/modules/records/ui/components/__tests__/healthRecordCardSurface.test.ts`  
Expected: FAIL (module / function not found)

- [ ] **Step 3: Implement helper**

```typescript
import type { AppColors } from '../../../../shared/theme/colors';
import type { SmartHealthRecordStatus } from '../../domain/models/SmartHealthRecord';

export function resolveHealthRecordCardSurface(params: {
  status: SmartHealthRecordStatus;
  isHero: boolean;
  colors: AppColors;
}): string {
  const { status, isHero, colors } = params;
  if (status === 'overdue' || status === 'missed') {
    return colors.dangerSurface;
  }
  if (isHero && status === 'upcoming') {
    return colors.brandTint12;
  }
  return colors.surface;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `yarn test -- src/modules/records/ui/components/__tests__/healthRecordCardSurface.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit** (only if user asked) — `test: add health record card surface helper`

---

### Task 2: Restyle `SmartHealthRecordItem` to Home card language

**Files:**
- Modify: `src/modules/records/ui/components/SmartHealthRecordItem.tsx`
- Consumes: `resolveHealthRecordCardSurface` from Task 1; existing `statusTone`, formatters, props
- Produces: Same public props API (`record`, `onMarkDone`, `onEditDate`, `onSkipDose`, `variant`, `primaryActionLabel`)

**Visual contract (from spec):**
- Container: `View` (or keep WidgetSurface only if it does not force left border) — prefer plain `View` with `borderRadius: radius.xl`, `shadows.sm`, `borderWidth: 1`, `borderColor` matching surface (overdue → dangerSurface border, hero → brandTint12, else `borderSubtle`)
- No left accent bar
- Meta: type icon + Shot/Worm medicine · status pill
- Title + when line + optional hint
- Primary CTA: pill (`radius.pill`), `minHeight: 44`, `colors.primary` (or `colors.danger` when overdue/missed), label from `primaryActionLabel` default **`I did this`**
- Secondary: Change date / Skip for now text links

- [ ] **Step 1: Change default `primaryActionLabel` to `'I did this'`**

```typescript
primaryActionLabel = 'I did this',
```

- [ ] **Step 2: Replace WidgetSurface + left border with home-style card shell**

Import `resolveHealthRecordCardSurface`. Build:

```tsx
const cardBg = resolveHealthRecordCardSurface({
  status: record.status,
  isHero,
  colors,
});
const cardBorder =
  record.status === 'overdue' || record.status === 'missed'
    ? colors.dangerSurface
    : isHero
      ? colors.brandTint12
      : colors.borderSubtle;

return (
  <View
    style={[
      styles.card,
      shadows.sm,
      {
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderRadius: radius.xl,
        padding: spacing.lg,
        gap: spacing.md,
      },
    ]}
  >
    {/* meta / title / when / hint / CTA — existing content, restyled */}
  </View>
);
```

Add to `createStyles`:

```typescript
card: {
  borderWidth: 1,
},
primaryCta: {
  alignSelf: 'flex-start',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  borderRadius: radius.pill,
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.lg,
},
```

For overdue/missed primary CTA, set `backgroundColor: colors.danger` inline when rendering.

- [ ] **Step 3: Align statusTone labels with spec**

Keep existing tone colors; ensure labels are: Do next (hero upcoming), Upcoming, Needs action, Done, Skipped, Not yet — already close; hero uses “Do next”.

- [ ] **Step 4: Update HealthRecordScreen call sites** that pass `primaryActionLabel={logPrimaryCtaLabel}` — set `logPrimaryCtaLabel = 'I did this'` (or remove override so default applies).

- [ ] **Step 5: Typecheck / lint touched file**

Run: `npx tsc --noEmit`  
Expected: no new errors in records UI

- [ ] **Step 6: Commit** (only if user asked) — `style: align smart health cards with home action cards`

---

### Task 3: `HealthHeroBar` (tint well + pill tabs)

**Files:**
- Create: `src/modules/records/ui/components/HealthHeroBar.tsx`
- Consumes: `Theme`, pet name/photo/age label, selected category, callbacks
- Produces: Presentational header only

**Props interface:**

```typescript
export type HealthCategoryFilter = 'Vaccination' | 'Deworming';

export interface HealthHeroBarProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  ageLabel: string; // e.g. "12 weeks old" | "Age not set"
  selectedCategory: HealthCategoryFilter;
  onPressBack: () => void;
  onSelectCategory: (category: HealthCategoryFilter) => void;
  theme: Theme;
}
```

- [ ] **Step 1: Implement component mirroring HomeHeroBar chrome**

Structure:
1. Outer well: `backgroundColor: colors.brandTint20`, `paddingHorizontal: spacing.lg`, `paddingTop: spacing.sm`, `paddingBottom: spacing.lg`, `borderBottomLeftRadius` / `Right: radius['3xl']`, `marginBottom: spacing.md`
2. Top row: back Pressable (44×44, `colors.surface`, `radius.round`, `shadows.sm`) · Image pet thumb 44 · “Caring for” footer + name caption bold · age caption under or beside
3. Title block: display “For ” + petName in `primaryDark` · subtitle **Health** (`textStyles.title`, extrabold, `primaryDark`)
4. Pill tabs row: map `[{ key: 'Vaccination', label: 'Shots' }, { key: 'Deworming', label: 'Worm medicine' }]`
   - Selected: `backgroundColor: colors.surface` (or `brandTint12`), bold heading/accent
   - Unselected: transparent, subdued text
   - `borderRadius: radius.pill`, `minHeight: 40`, horizontal padding `spacing.md`

Reference layout patterns from:
- `src/modules/app/ui/components/home/HomeHeroBar.tsx`
- Pill action from `HomeActionHealthCarousel.tsx`

- [ ] **Step 2: Export named component; no default export**

- [ ] **Step 3: Commit** (only if user asked) — `feat: add HealthHeroBar matching home chrome`

---

### Task 4: Wire `HealthRecordScreen` to hero + section labels

**Files:**
- Modify: `src/modules/records/ui/screens/HealthRecordScreen.tsx`
- Consumes: `HealthHeroBar`, `resolvePetAvatarSource`, existing list/modals
- Produces: Unchanged navigation/modals; new chrome

- [ ] **Step 1: Import helpers**

```typescript
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';
import { HealthHeroBar } from '../components/HealthHeroBar';
```

- [ ] **Step 2: Replace flat header + underline tabs with HealthHeroBar**

When `activePet` exists:

```tsx
<SafeAreaView
  edges={['top', 'left', 'right']}
  style={[
    styles.safeArea,
    {
      backgroundColor: colors.brandTint20,
    },
  ]}
>
  <HealthHeroBar
    petName={activePet.name}
    petPhoto={resolvePetAvatarSource(activePet)}
    ageLabel={
      petAgeWeeks !== null ? `${petAgeWeeks} weeks old` : 'Age not set'
    }
    selectedCategory={selectedCategory}
    onPressBack={() => navigation.goBack()}
    onSelectCategory={setSelectedCategory}
    theme={theme}
  />
  <View style={{ flex: 1, backgroundColor: colors.backgroundAlt }}>
    {/* existing banner + SectionList */}
  </View>
  {/* modals unchanged */}
</SafeAreaView>
```

Remove old `styles.header` / `tabsRow` / underline `tab` usage from the JSX (styles can be deleted if unused).

- [ ] **Step 3: SectionList content padding**

Match Home body: `paddingHorizontal: spacing.lg` on list `contentContainerStyle` (keep `tabBarInset` bottom padding).

- [ ] **Step 4: Rename section titles**

Where sections are built:

```typescript
title: 'Coming up', // was UPCOMING / similar
// history:
title: `History (${displayCompletedRecords.length})`,
```

List header “NEXT STEP” →:

```tsx
<AppText
  style={[
    textStyles.subtitle,
    { color: colors.text.heading, fontFamily: fontFamilies.bold },
  ]}
>
  Do next
</AppText>
```

Section headers for upcoming/history: use `textStyles.subtitle` + bold heading (Home section head), not `textStyles.overline` ALL CAPS.

- [ ] **Step 5: Empty on-track cards**

Set `borderRadius: radius.xl`, `shadows.sm` optional, keep copy.

- [ ] **Step 6: Set CTA label**

```typescript
const logPrimaryCtaLabel = 'I did this';
```

- [ ] **Step 7: Manual verify checklist**

On device/simulator:
1. Health tab opens with tint well + pet avatar + For {name} / Health
2. Shots / Worm medicine are pill chips; switching filters list
3. Do next hero card is brandTint12; overdue is dangerSurface
4. Primary pill says I did this; opens existing modal and saves
5. Change date / Skip still work for deworm
6. History expand/collapse still works
7. Footer disclaimer still visible
8. Dark mode: tokens still readable (no hardcoded colors)

- [ ] **Step 8: Lint / typecheck**

Run: `yarn lint` (or scoped) and `npx tsc --noEmit`  
Expected: clean for touched files

- [ ] **Step 9: Commit** (only if user asked) — `feat: align Health Records chrome with Home`

---

## Spec coverage self-review

| Spec requirement | Task |
| --- | --- |
| Brand-tint hero well + pet context | Task 3–4 |
| Pill segment tabs | Task 3–4 |
| Do next / Coming up / History labels | Task 4 |
| Card xl + shadow, no left bar | Task 2 |
| brandTint12 / dangerSurface / surface | Task 1–2 |
| Pill CTA I did this | Task 2, 4 |
| Modals/engines unchanged | All tasks (UI only) |
| Theme tokens only | All tasks |

## Placeholder scan

No TBD/TODO left in steps. Commit steps gated on user request.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-16-health-tab-home-aligned-ui.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
**2. Inline Execution** — implement in this session with checkpoints  

**Which approach?**
