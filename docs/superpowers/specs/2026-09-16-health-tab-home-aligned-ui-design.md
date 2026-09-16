# Health Tab Home-Aligned UI Design

**Date:** 2026-09-16  
**Status:** Approved — awaiting implementation plan  
**Approach:** Option 2 — mirror Home chrome + card language; keep Smart Health data flow

## Goal

Make the Health Records tab (Shots / Worm medicine) feel like the Home screen: brand-tint hero well, pill segments, and home-style action cards — without changing scheduling engines, stores, or mark-done / reschedule / skip behavior.

## Non-goals

- Domain / template / engine changes (`CarePlanTemplates`, `DewormingEngine`, `PetCareLifecycleEngine`)
- New parasite products or vaccine logic
- Rebuilding Health as a full Home-style dashboard with carousels
- Deleting obsolete dual-model deworming types
- Changing modal validation rules

## Decisions

| Topic | Choice |
| --- | --- |
| Scope | Visual + IA labels only on Health Records UI |
| Chrome | Home-like brand-tint hero well + pet context |
| Tabs | Pill segment chips (not underline) |
| Cards | Match Home “Needs action” card language (vertical list) |
| Primary CTA copy | Kid-simple **I did this** (or **Log** if we keep Home parity — default **I did this**) |
| Data | Existing `SmartHealthRecord` + `smartHealthRecordStore` unchanged |
| Architecture | UI-only; Clean Architecture layers untouched |

## Current vs target

| Area | Today | Target |
| --- | --- | --- |
| Header | Flat row, back + name + age | Brand-tint well (`brandTint20`), rounded bottom `radius['3xl']` |
| Tabs | Underline Shots / Worm medicine | Pill chips; selected = brandTint12 / accent text |
| Section titles | `NEXT STEP`, `HISTORY` ALL CAPS | Sentence case: **Do next**, **Coming up**, **History** |
| Cards | WidgetSurface + left accent bar | `radius.xl` + `shadows.sm`; no left bar |
| Hero card | Same item, left bar accent | `brandTint12` fill (overdue → `dangerSurface`) |
| CTA | Full-width rectangular accent | Pill (`radius.pill`), minHeight 44 |

## Screen chrome

**Safe area**

- Well region: `colors.brandTint20`
- List body: `colors.backgroundAlt`

**Hero well contents**

1. Top row: back button (surface circle) · pet avatar + “Caring for” / pet name · age caption (weeks / not set)
2. Title: display “For {petName}” + bold subtitle **Health**
3. No Home alert/profile icons (Health stays focused)

**Category tabs**

- Two pills: **Shots** · **Worm medicine**
- Selected: filled `brandTint12` (or surface on tint well), bold accent/heading text
- Unselected: transparent / subtle text
- Placement: inside well bottom or immediately under well, still visually part of chrome

## Cards (`SmartHealthRecordItem`)

**Surfaces**

| State | Background |
| --- | --- |
| Hero / do-next (not overdue) | `brandTint12` |
| Overdue / missed | `dangerSurface` |
| Default upcoming | `surface` |
| Completed / skipped / locked | `surface` |

**Layout**

1. Meta row: type icon + “Shot” / “Worm medicine” · status chip (Do next / Upcoming / Needs action / Done / Skipped / Not yet)
2. Title: `plainVaccineDisplayName` (existing)
3. When line: existing relative/absolute formatters; urgency color for overdue
4. Optional caption: protection hint / cadence / skip reason (one line, subdued)
5. Primary pill CTA when actionable
6. Secondary text links: Change date · Skip for now (deworm only)

**Actions unchanged in behavior**

- Mark done → existing vaccination / deworming modals
- Edit date → existing reschedule modal
- Skip → existing skip modal (deworm only)
- Locked / syncing: no primary CTA; show syncing suffix on when line when applicable

## Sections

| Label | Content |
| --- | --- |
| Do next | Primary task card (`variant="hero"`) or on-track empty hint |
| Coming up | Upcoming list (existing slice limits) |
| History | Completed/skipped; keep expand/collapse |

Footer disclaimer (“reminders… vet decides”) stays if already present; wording unchanged.

## Components / files (expected touchpoints)

| File | Change |
| --- | --- |
| `HealthRecordScreen.tsx` | Hero well chrome, pill tabs, section title copy, spacing to match Home body padding |
| `SmartHealthRecordItem.tsx` | Card surfaces, remove left bar, pill CTA, hierarchy polish |
| Optional small extract | `HealthHeroBar.tsx` if hero markup is large — only if it keeps screen readable |

No new store methods. Prefer theme tokens only (no hardcoded hex).

## Error / empty states

- Focus-unavailable banner: keep; restyle lightly to match surface + border tokens if needed
- On-track empty: soft `surface` card, `radius.xl`, existing copy meaning
- Loading / error: keep existing patterns; align padding with Home body (`spacing.lg`)

## Testing

- No domain test changes required
- Manual: Shots + Worm tabs, hero/overdue/locked/completed, mark done / change date / skip
- Snapshot/visual: optional; not required for this pass
- Lint/typecheck touched UI files

## Success criteria

1. Opening Health feels continuous with Home (tint well + pet context).
2. Tabs are pill chips, not underlines.
3. Shot/worm cards match Home action-card language (xl radius, tint/danger surfaces, pill CTA).
4. Mark done / reschedule / skip still work with the same validation.
5. No engine or Firestore schema changes.

## Spec self-review notes

- Primary CTA default fixed to **I did this** (kid-simple SSOT from Smart Health design); Home carousel may still say Log elsewhere.
- Approach 3 (dashboard rebuild) explicitly out of scope.
- Dual-model deworm cleanup remains a later PR.
