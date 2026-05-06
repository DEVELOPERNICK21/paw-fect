# Health records — validation strategy & test matrix

Use this checklist for QA and for AI-assisted regression reviews.  
**Domain sources of truth:** `validateLogDateForCadence` (+ `getMinimumLogDate`) in `DewormingEngine.ts`, `validateVaccinationLogDate` (+ `resolvePrerequisiteCompletedDate`) in `vaccinationLogValidation.ts`, `assertDateNotBeforePetDob` in `healthRecordDateGuards.ts`, `RescheduleSmartHealthRecord`, `MarkSmartHealthRecordDone`, `BootstrapSmartHealthSchedule`.

---

## Strategy (why things fail in production)

| Principle | Implementation |
|-----------|------------------|
| Never schedule/logs before pet existed | DOB lower bound everywhere (guards + pickers). |
| Deworming spacing ≠ arbitrary calendar | Min spacing after **last logged dose**; upper bound widened using **this row’s scheduled `dueDate`** so overdue rows still validate. |
| Rolling lookback | After last dose exists, log date must be ≥ `getMinimumLogDate(dob, today, cadence)` so logs from years ago are rejected for recurring doses (first dose exempt). |
| Vaccination series order | If `dependsOn` is set, prior dose must be **completed** first; log date ≥ prior completion date. |
| No future completion | `today` upper bound. |
| Defence in depth | UI (`HealthRecordScreen`) + use cases (`MarkSmartHealthRecordDone`, `RescheduleSmartHealthRecord`). |

---

## Deworming — edge cases & tests

| ID | Scenario | Expected |
|----|-----------|----------|
| D-LOG-01 | First dose, date inside first-dose window | Accept (`validateFirstDose`). |
| D-LOG-02 | First dose, date before allowed window | Reject with first-dose message. |
| D-LOG-03 | Repeat dose, date ≥ last completion + min spacing | Accept. |
| D-LOG-04 | Repeat dose, date **before** last completion + min spacing | Reject. |
| D-LOG-05 | Repeat dose, **overdue** scheduled due vs narrow “after last” window | Accept when `scheduledDueDate` widens upper bound (same calendar entry). |
| D-LOG-06 | Repeat dose, date older than rolling `getMinimumLogDate` | Reject (“too far in the past for this interval”). |
| D-LOG-07 | Any dose, date before DOB | Reject. |
| D-LOG-08 | Any dose, future date | Reject. |
| D-LOG-09 | Last completion excludes **current row id** when inferring baseline | No self-reference when editing/logging. |
| D-BOOT-01 | Bootstrap after pet create | Rows generated; deworming dates ≥ DOB phase rules. |
| D-BOOT-02 | Re-bootstrap after DOB / lifestyle change | Stale open deworming removed per `BootstrapSmartHealthSchedule`. |
| D-COMP-01 | Mark done shifts future deworm rows | `recalculatePlanOnEvent` cadence walk. |
| D-COMP-02 | Mark done supersedes older open doses | Skipped with supersede reason. |
| D-SKIP-01 | Skip dose redraws future dates | Engine skip path + cadence. |
| D-RES-01 | Reschedule deworming before today | Reject (`RescheduleSmartHealthRecord`). |
| D-RES-02 | Reschedule before DOB | Reject. |
| D-RES-03 | Reschedule too soon after last completed dose | Reject (min gap). |
| D-UI-01 | Deworm log picker `minimumDate` | Uses `getMinimumLogDate`; `maximumDate` = today. |

**Automated tests (existing / target files):** `DewormingEngine.test.ts` (cadence), `healthRecordDateGuards.test.ts`, extend Deworming tests for `scheduledDueDate` + rolling min.

---

## Vaccination — edge cases & tests

| ID | Scenario | Expected |
|----|-----------|----------|
| V-LOG-01 | Log date **before** scheduled `dueDate` | Reject. |
| V-LOG-02 | Log date **before** pet DOB | Reject. |
| V-LOG-03 | Future log date | Reject. |
| V-LOG-04 | Log date **before** prior dose completion (`dependsOn`) | Reject (series order). |
| V-LOG-05 | `dependsOn` set but prior dose not completed | Reject (“complete previous dose first”). |
| V-LOG-06 | Log date absurdly late vs due (e.g. typo year) | Reject if beyond `MAX_DAYS_AFTER_DUE` from `vaccinationLogValidation.ts`. |
| V-LOG-07 | No pet DOB | UI blocks; server falls back to minimal vaccination rule only if DOB omitted. |
| V-BOOT-01 | Puppy series from DOB | Ordered doses + `dependsOn`. |
| V-BOOT-02 | Adult catch-up from “today” | Due dates anchored to now, still ≥ realistic bounds. |
| V-COMP-01 | Completing dose unlocks dependent (+3 weeks) | `PetCareLifecycleEngine` completion path. |
| V-RES-01 | Reschedule vaccination before DOB | Reject (picker + guard). |
| V-UI-01 | Vaccination log picker `minimumDate` | `max(DOB, dueDate)`; `maximumDate` = today. |

**Automated tests:** `vaccinationLogValidation.test.ts` (prerequisite, due, DOB, future, max-late).

---

## Cross-cutting

| ID | Scenario | Expected |
|----|-----------|----------|
| X-01 | API / store bypass UI | `MarkSmartHealthRecordDone` repeats validations when DOB passed. |
| X-02 | Notification IDs after reschedule | Cancel + reschedule in `smartHealthRecordStore`. |
| X-03 | Multi-pet | Records scoped per `petId` from repository load. |

---

## CI suggestion

```bash
yarn test DewormingEngine.test.ts healthRecordDateGuards.test.ts vaccinationLogValidation.test.ts
```

Extend with `MarkSmartHealthRecordDone` integration tests when a test double for `SmartHealthRecordRepository` exists.
