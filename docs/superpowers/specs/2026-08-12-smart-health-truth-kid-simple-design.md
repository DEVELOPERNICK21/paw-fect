# Smart Health Truth + Kid-Simple Care Design

**Date:** 2026-08-12  
**Status:** Approved — implementing  
**Approach:** Option C scope via Approach 1 — fix dangerous schedule truth on the live SmartHealth domain path; kid-simple owner copy/actions; preserve clean architecture and SSOT

## Goal

Show pet parents the **right care reminders** with words and buttons an **8–10 year old** could understand, without inventing a second schedule system. Domain business logic stays the product core; UI only translates and acts.

## Decisions

| Topic | Choice |
| --- | --- |
| Scope | **C** — kid-simple UX + most dangerous schedule/truth fixes only |
| Architecture | **Approach 1** — live SmartHealth path only; no parallel reminder engine |
| Priority order | **Truth first**, then kid-simple words/actions |
| SSOT for rules | `CarePlanTemplates` |
| SSOT for plan + history | `SmartHealthRecord` (Firestore); AsyncStorage cache only |
| Deworming dates | `DewormingEngine` reads template `deworming` block (same SSOT) |
| Plan assembly / events | `PetCareLifecycleEngine` |
| Dead dual-model | Document obsolete; do **not** expand; delete in a later cleanup PR |
| Out of scope | Heartworm/tick product, core-vaccine skip, DailyScheduleEngine, full dead-code deletion, kitten-only deworm start-week tweak (3w) |

## Engine map (current reality)

### Live (keep — main domain)

```
CARE_PLAN_TEMPLATES
        │
        ├─ PetCareLifecycleEngine.generateInitialPlan / recalculatePlanOnEvent
        │         └─ dewormingEngine.execute (worm milestones)
        │
        └─ SmartHealthScheduleUtils (bootstrap wrapper, next recurring helper)
                │
                └─ Use cases → Repository → Firestore + AsyncStorage cache
                        │
                        └─ Store → UI (plain-language map) + notifications
```

### Helpers (keep)

- `DewormingScheduleStateMachine` — status transition guard only (not a schedule generator)
- `vaccinationLogValidation` / deworm log validation — date windows for “I did this”

### Obsolete / unused (do not build on)

- `docs/health-system.md` describing deleted `HealthScheduleEngine` / `healthScheduleStore`
- `DewormingSchedule` + `DewormingRecord` types and `dewormingSelectors.ts` / `recoveryMode.ts` (unwired dual model)
- UI already projects worms from `SmartHealthRecord` via `projectDewormingFromSmartRecords`

## Architecture (unchanged layers)

```
UI (kid-simple labels + actions)
  → smartHealthRecordStore
    → Bootstrap / MarkDone / Skip / Reschedule use cases
      → PetCareLifecycleEngine + DewormingEngine + CarePlanTemplates
        → SmartHealthRecordRepository
          → Firestore (SoT) + AsyncStorage (cache)
```

**Rules:**

- UI never invents due dates or intervals.
- Templates are the only place age/interval/region rules change.
- Completed / skipped / rescheduled facts live on `SmartHealthRecord`.
- Cross-feature home widgets read SmartHealth selectors — not DailyScheduleEngine.

## Domain truth fixes (this pass)

1. **Final puppy/kitten core dose ≥16 weeks**  
   Last *required* DHPP/FVRCP dose must land at age ≥16 weeks. Earlier priming doses stay; any pre-16 “final” required dose is wrong.

2. **Rabies booster phases**  
   First booster uses `rabies.boosterAfterMonths` (12). Later repeats use `regionOverrides` (IN/OTHER: 12, US/EU: 36). `boosterAfterMonths` must be read by the engine (today it is unused).

3. **Next dose after completion**  
   `createNextRecurringRecord` (and equivalent paths) must use template/region months for that family — not hard-coded `+12` for every `yearly` row.

4. **Missing date of birth**  
   Do not bootstrap with “today” as DOB. **This pass:** require a real DOB before create/bootstrap (plain error: “Add your pet’s birthday first”). Approximate-age → DOB conversion is a later enhancement, not in this pass.

5. **Rabies anchor purity**  
   Rabies next dates anchor only to rabies history / rabies records — never to “any last vaccination”.

6. **Reminder framing (liability)**  
   Owner copy and notifications are reminders. Footer: vet decides. Avoid bare “required” / “you must complete” as medical law.

7. **Deworming life-stage truth (verified — light fix in this pass)**  
   Manual check of `CarePlanTemplates.deworming` + `DewormingEngine` vs CAPC-style guidance:

   | Phase | Template / engine | Verdict |
   | --- | --- | --- |
   | Early (puppy/kitten) | `startWeeks: [2,4,6,8]` → every 14 days | **OK** (matches common 2/4/6/8 week protocol) |
   | Growth | monthly from month 3 through `untilMonths: 6` | **OK enough** (after week 8, next monthly at ~3 mo; not age-flattened into adult) |
   | Adult indoor | `adultIntervalMonths: 3` (~quarterly) | **OK** as reminder cadence (CAPC prefers monthly broad-spectrum preventives; we stay intestinal reminder-only this pass) |
   | Adult outdoor/mixed | template days 60 → ~2 months | **Intended OK**, but see bug below |
   | Cat vs dog early | same `[2,4,6,8]` | **Oversimplified** (kittens often start ~3 weeks) — **out of this pass**; note only |

   **Bug to fix in this pass (not architecture-only):**  
   `buildIdealMilestoneDates` advances the adult ideal grid with  
   `adultIntervalMonthsFromLifestyle(petType, 'indoor')` **always**, ignoring pet lifestyle.  
   So outdoor/mixed pets get a **quarterly** ideal adult grid until a completion realigns via `expandForwardFromCompletion` (which *does* use lifestyle). That is age/lifestyle truth drift on first bootstrap — same class of “wrong interval shown as fact” as the vaccine bugs.

   **Fix:** pass the pet’s lifestyle into ideal adult stepping (and any bootstrap path that builds the open worm list). Keep kid-simple label “Worm medicine”; no new parasite product types.

## Kid-simple UX

Storage keys stay technical (`DHPP`, `RABIES_1`). Display via `vaccinePlainLanguage` (and related UI strings).

| Domain / today | Owner sees |
| --- | --- |
| DHPP / FVRCP | Main body vaccine (shot N of M) |
| Rabies | Rabies shot — very important. Ask your vet. |
| Deworming | Worm medicine |
| Mark done | I did this |
| Reschedule | Change date |
| Skip (deworm only) | Skip for now |
| Overdue / missed | Late — do this soon |
| Locked | Wait — do the earlier shot first |

**Health Records footer (always):**  
“These are reminders to help you remember. Your vet decides what is right for your pet.”

**Primary actions on the main card:** one primary (**I did this**), one secondary (**Change date**), optional tertiary for worms (**Skip for now**).

## Error handling

- Invalid log dates: short plain errors (“Pick a day on or after the last shot.”).
- Late-but-allowed: soft warn + “Log anyway” / ask vet nudge (keep existing tier idea; simplify wording).
- Missing DOB: block with “Add your pet’s birthday first”.
- Domain validation remains in use cases (defence in depth); UI is not the only gate.

## Testing

- Update `PetCareLifecycleEngine` tests for ≥16w required final, rabies 12-then-region, rabies anchor purity.
- Update `SmartHealthScheduleUtils` / MarkDone-related tests for region-aware next recurrence.
- Update `DewormingEngine` tests: outdoor/mixed adult ideal grid uses ~2-month step (not forced indoor quarterly).
- Update `vaccinePlainLanguage` tests for kid-simple strings.
- Add/adjust bootstrap/DOB guard tests at pet create / bootstrap boundary.
- Do not require DailyScheduleEngine tests for this work.

## Docs

- Replace or clearly mark obsolete `docs/health-system.md` to point at SmartHealth + this SSOT map.
- Note dual-model files as obsolete pending cleanup PR.

## Non-goals (explicit)

- New parasite products (heartworm, flea/tick schedules)
- Skipping core vaccines
- Merging WellnessStore with SmartHealth
- Rewriting DailyScheduleEngine
- Full deletion of unused deworming dual-model in this pass (document only)

## Success criteria

1. A pet parent can open Health Records and know the next action in plain words.
2. Generated schedules match the truth fixes above (tests green).
3. One SSOT path only — no second schedule engine introduced.
4. Copy frames care as reminders + ask your vet.
5. Missing DOB cannot silently create a newborn puppy plan.
6. Outdoor/mixed adult worm reminders are not stuck on indoor quarterly on first bootstrap.
