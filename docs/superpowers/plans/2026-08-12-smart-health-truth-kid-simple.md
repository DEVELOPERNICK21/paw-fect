# Smart Health Truth + Kid-Simple Care Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dangerous SmartHealth schedule truth on the live domain path, then rewrite owner-facing care copy/actions to 8–10-year-old plain English — one SSOT, no second engine.

**Architecture:** Keep `CarePlanTemplates` → `PetCareLifecycleEngine` / `DewormingEngine` → `SmartHealthRecord` (Firestore). UI maps labels only. Truth fixes land in templates + engines + recurrence helper; kid-simple strings in `vaccinePlainLanguage` + Health Records / notifications.

**Tech Stack:** React Native, TypeScript, Zustand, Jest, Firestore-backed SmartHealth records

## Global Constraints

- Truth first, then kid-simple UX
- No parallel schedule engine; do not expand obsolete `DewormingSchedule` / `DewormingRecord` model
- Owner copy = reminders + ask vet; no bare “required medical law”
- Require real DOB before bootstrap (no “born today”)
- Kid-simple English for pet parents (8–10 year old clarity)
- Out of scope: heartworm/tick products, core-vaccine skip, DailyScheduleEngine, full dead-code deletion, kitten 3-week deworm start tweak

## File map

| File | Responsibility |
| --- | --- |
| `CarePlanTemplates.ts` | Required final core dose ≥16 weeks; keep rabies `boosterAfterMonths` |
| `PetCareLifecycleEngine.ts` | Use rabies first-booster vs region repeat; rabies anchor purity |
| `SmartHealthScheduleUtils.ts` | Region/family-aware next recurrence months |
| `DewormingEngine.ts` | Ideal adult grid uses pet lifestyle |
| `petStore.ts` / create-pet path | Block missing DOB |
| `vaccinePlainLanguage.ts` | Kid-simple display names |
| `HealthRecordScreen.tsx` + item/actions | Footer + “I did this” / “Change date” / “Skip for now” |
| `smartHealthNotificationSchedule.ts` | Softer reminder notification bodies |
| `docs/health-system.md` | Point at SmartHealth SSOT; mark obsolete |

---

### Task 1: Required core final dose ≥16 weeks

**Files:**
- Modify: `src/modules/records/domain/models/CarePlanTemplates.ts`
- Test: `src/modules/records/domain/utils/__tests__/PetCareLifecycleEngine.test.ts`

**Interfaces:**
- Consumes: `VaccineRule` in templates
- Produces: Dog `DHPP_3` and cat `FVRCP_3` with `ageWeeksMin: 16` (required); optional 4th may shift or remain later optional only if still needed

- [ ] **Step 1: Write failing test** — puppy plan’s last required DHPP/FVRCP due date is at DOB+16 weeks (not 12–14).
- [ ] **Step 2: Run test** — expect fail on current templates.
- [ ] **Step 3: Update templates** — set last required core dose `ageWeeksMin`/`Max` to ≥16; adjust prior priming doses; keep optional only if still meaningful.
- [ ] **Step 4: Run tests** — pass.
- [ ] **Step 5: Commit** (if user requested commits) — `fix: require final puppy/kitten core vaccine at 16+ weeks`

---

### Task 2: Rabies first booster + region repeat + anchor purity

**Files:**
- Modify: `src/modules/records/domain/utils/PetCareLifecycleEngine.ts` (rabies scheduling ~392–441)
- Test: `PetCareLifecycleEngine.test.ts`

**Interfaces:**
- Consumes: `template.rabies.boosterAfterMonths`, `regionOverrides`, `lastRabiesDate`
- Produces: First scheduled rabies booster at +`boosterAfterMonths` from first dose / last rabies; do not fall back to `lastVaccinationDate` for rabies

- [ ] **Step 1: Failing tests** — US first rabies booster +12 months; IN +12; after first booster completion path uses region for next (covered also in Task 3); adult with only DHPP history does not invent rabies from that date when `lastRabiesDate` missing (skip first dose path as designed, booster only if rabies anchor exists OR schedule first dose — no DHPP contamination).
- [ ] **Step 2: Implement** — use `boosterAfterMonths` for first booster after primary; `regionOverrides` for subsequent; remove `lastVaccinationDate` from rabies anchor chain.
- [ ] **Step 3: Tests pass**

---

### Task 3: Region-aware next recurrence after “I did this”

**Files:**
- Modify: `src/modules/records/domain/utils/SmartHealthScheduleUtils.ts` (`createNextRecurringRecord`)
- Possibly: pass `region` into helper or store `recurrenceMonths` on record at generation
- Test: `SmartHealthScheduleUtils.test.ts`

**Preferred approach:** At generation time set a clear recurrence interval on the record when possible; at minimum resolve months from `CARE_PLAN_TEMPLATES` + pet region for Rabies and core yearly boosters (IN core yearly OK; US rabies after first booster 36).

- [ ] **Step 1: Failing test** — completing US rabies booster with region US yields next due +36 months (or first post-primary +12 then later +36 per stored phase).
- [ ] **Step 2: Implement minimal recurrence months resolution from templates + region/family.
- [ ] **Step 3: Tests pass**

---

### Task 4: Deworming ideal adult grid uses lifestyle

**Files:**
- Modify: `src/modules/records/domain/utils/DewormingEngine.ts` (`buildIdealMilestoneDates`, callers)
- Test: `DewormingEngine.test.ts`

- [ ] **Step 1: Failing test** — outdoor adult with no completions has adult dues ~60 days / 2 months apart, not 3.
- [ ] **Step 2: Pass `lifestyle` into `buildIdealMilestoneDates`; use `adultIntervalMonthsFromLifestyle(petType, lifestyle)`.
- [ ] **Step 3: Tests pass**

---

### Task 5: Require DOB before bootstrap

**Files:**
- Modify: `src/modules/pets/store/petStore.ts` (create/update bootstrap calls)
- Modify: create-pet validation path if DOB optional today (`AddPetScreen` / `CreatePetProfile`)
- Test: existing pet create tests or add focused unit test around guard

- [ ] **Step 1: Failing test / assert** — missing DOB does not call bootstrap with today; returns plain error “Add your pet’s birthday first”.
- [ ] **Step 2: Implement guard**; remove `dob ?? today` fallback for health bootstrap.
- [ ] **Step 3: Tests pass**

---

### Task 6: Kid-simple plain language + Health Records actions/footer

**Files:**
- Modify: `vaccinePlainLanguage.ts` + tests
- Modify: `HealthRecordScreen.tsx` (footer, button labels)
- Modify: `SmartHealthRecordItem.tsx` if status labels live there
- Modify: `smartHealthNotificationSchedule.ts` bodies

- [ ] **Step 1: Update plain-language map** to spec table (Main body vaccine, Worm medicine, Rabies ask vet, etc.).
- [ ] **Step 2: Wire footer + action labels** (“I did this”, “Change date”, “Skip for now”, status phrases).
- [ ] **Step 3: Soften notifications** to reminder tone.
- [ ] **Step 4: Tests for plain language**

---

### Task 7: Docs SSOT cleanup

**Files:**
- Modify: `docs/health-system.md` — obsolete banner + pointer to SmartHealth + design spec
- Modify: design spec status → Approved / implementing

- [ ] **Step 1: Rewrite health-system.md header** as obsolete; document live SSOT path.
- [ ] **Step 2: Note dual-model files obsolete**

---

### Task 8: Verification

- [ ] Run: `yarn test -- src/modules/records/domain`
- [ ] Run: targeted plain-language + pet DOB tests
- [ ] `npx tsc --noEmit` if time permits on touched paths

## Spec coverage check

| Spec item | Task |
| --- | --- |
| ≥16w required final | 1 |
| Rabies booster phases | 2 |
| Next recurrence months | 3 |
| Missing DOB | 5 |
| Rabies anchor purity | 2 |
| Reminder framing | 6 |
| Deworm lifestyle ideal grid | 4 |
| Kid-simple UX | 6 |
| Docs | 7 |
