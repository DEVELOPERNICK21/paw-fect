# Pawsoul — AI Agent Robustness Prompt

> Paste this entire document as context when instructing your coding agent to write tests,
> review logic, or harden validation in the Pawsoul codebase.

---

## 1. Product context (why correctness matters here)

Pawsoul is the operating system for preventive pet care — its entire value proposition is that
owners follow the schedule and nothing falls through the cracks. A validation bug is not a
minor UX issue: it means a pet misses a vaccine dose or a deworming treatment. Every edge
case below must be treated as a patient safety issue, not a polish task.

**Core invariants that must never be violated:**
- A health record can never be logged before the pet existed (DOB lower bound).
- A health record can never be logged in the future (today upper bound).
- Recurring doses must respect minimum spacing after the last completed dose.
- Vaccination series must be completed in order when `dependsOn` is set.
- All validations must fire at the use-case layer even when the UI is bypassed.

---

## 2. Domain source of truth — files the agent must read before touching anything

| File | What it owns |
|------|-------------|
| `DewormingEngine.ts` | `validateLogDateForCadence`, `getMinimumLogDate` |
| `vaccinationLogValidation.ts` | `validateVaccinationLogDate`, `resolvePrerequisiteCompletedDate` |
| `healthRecordDateGuards.ts` | `assertDateNotBeforePetDob` |
| `MarkSmartHealthRecordDone` | Use-case layer validation (must mirror UI validation) |
| `RescheduleSmartHealthRecord` | Reschedule guard (must reject past dates and DOB violations) |
| `BootstrapSmartHealthSchedule` | Schedule generation; must not re-generate completed series |
| `smartHealthRecordStore` | Notification cancel + reschedule on every state change |

**Agent rule:** Never modify a validation without also updating its corresponding test file.
Never add a new validation path without adding it to the use-case layer too (defence in depth).

---

## 3. Existing test matrix (what is already covered — do not regress these)

### 3a. Deworming

| ID | Scenario | Expected |
|----|----------|----------|
| D-LOG-01 | First dose inside first-dose window | Accept |
| D-LOG-02 | First dose before allowed window | Reject — first-dose message |
| D-LOG-03 | Repeat dose ≥ last completion + min spacing | Accept |
| D-LOG-04 | Repeat dose before last completion + min spacing | Reject |
| D-LOG-05 | Overdue scheduled row — `scheduledDueDate` widens upper bound | Accept |
| D-LOG-06 | Date older than rolling `getMinimumLogDate` | Reject — too far in the past |
| D-LOG-07 | Any dose before DOB | Reject |
| D-LOG-08 | Any dose with future date | Reject |
| D-LOG-09 | Current row excluded from last-completion inference | No self-reference |
| D-BOOT-01 | Bootstrap after pet create | Rows generated; dates ≥ DOB phase rules |
| D-BOOT-02 | Re-bootstrap after DOB/lifestyle change | Stale open records removed |
| D-COMP-01 | Mark done shifts future deworming rows | `recalculatePlanOnEvent` cadence walk |
| D-COMP-02 | Mark done supersedes older open doses | Skipped with supersede reason |
| D-SKIP-01 | Skip dose redraws future dates | Engine skip path + cadence |
| D-RES-01 | Reschedule before today | Reject |
| D-RES-02 | Reschedule before DOB | Reject |
| D-RES-03 | Reschedule too soon after last completed dose | Reject — min gap |
| D-UI-01 | Log picker `minimumDate` uses `getMinimumLogDate`; `maximumDate` = today | Verified |

### 3b. Vaccination

| ID | Scenario | Expected |
|----|----------|----------|
| V-LOG-01 | Log date before scheduled `dueDate` | Reject |
| V-LOG-02 | Log date before DOB | Reject |
| V-LOG-03 | Future log date | Reject |
| V-LOG-04 | Log date before prior dose completion (`dependsOn`) | Reject |
| V-LOG-05 | `dependsOn` set but prior dose not completed | Reject — complete previous first |
| V-LOG-06 | Date beyond `MAX_DAYS_AFTER_DUE` | Reject |
| V-LOG-07 | No pet DOB | UI blocks; server uses minimal rule only |
| V-BOOT-01 | Puppy series from DOB | Ordered doses with `dependsOn` |
| V-BOOT-02 | Adult catch-up from today | Due dates anchored to now |
| V-COMP-01 | Completing dose unlocks dependent (+3 weeks) | Completion path correct |
| V-RES-01 | Reschedule before DOB | Reject at picker and guard |
| V-UI-01 | Log picker `minimumDate` = `max(DOB, dueDate)`; `maximumDate` = today | Verified |

### 3c. Cross-cutting

| ID | Scenario | Expected |
|----|----------|----------|
| X-01 | API/store bypasses UI | `MarkSmartHealthRecordDone` repeats all validations |
| X-02 | Notification IDs after reschedule | Cancel + reschedule in store |
| X-03 | Multi-pet | Records scoped per `petId` from repository |

---

## 4. NEW edge cases the agent must implement (gaps not yet covered)

Every item below needs: (a) a unit test, (b) verification that the use-case layer enforces
the same rule as the UI layer.

### 4a. Multi-pet and account integrity

**MP-01 — DOB edited after records exist**
- When a pet's DOB is updated, re-validate all existing open records against the new DOB.
- Past completed logs must not be retroactively rejected, but future-scheduled dates must be
  recomputed.
- If a completed log now pre-dates the new DOB, surface a data-integrity warning, do not
  silently delete it.

**MP-02 — Pet deleted with open schedules**
- Deleting a pet must atomically tear down: all SmartHealthRecords, all scheduled
  notifications, all pending reminders for that `petId`.
- Test: after delete, query repository for petId — must return empty. Query OS notification
  store — must return no pending notifications for any recordId that belonged to that pet.

**MP-03 — Two pets with identical breed and DOB**
- Bootstrap must generate fully independent schedule trees scoped to each `petId`.
- Test: complete a dose for pet A; verify pet B's schedule is completely unchanged.

**MP-04 — Pet transferred between user accounts**
- `petId` scoping must survive an ownership transfer. All records must move with the pet.
- No orphan records on the old account. No duplicate records on the new account.

### 4b. Timezone and clock edge cases

**TZ-01 — User crosses midnight in a different timezone**
- "Today" must be computed in the device's local timezone, not UTC.
- A log submitted at 11:55 PM IST must use the IST date, not the UTC date (which may be the
  next calendar day).
- The server-side use-case validation must accept the client-supplied log date if it is ≤
  the client's local "today". Do not compare client date against server UTC date.

**TZ-02 — Device clock rolled backward after a log was saved**
- A stored record must not be retroactively invalidated because the device clock changed.
- Validation only fires at write time. Reads are always trusted.

**TZ-03 — DST boundary day**
- Test a due date that falls exactly on a spring-forward or fall-back day.
- Spacing math that uses millisecond arithmetic can produce off-by-one-hour results. Use
  calendar-day arithmetic (date-only comparison), not raw millisecond diff, for spacing
  checks.

**TZ-04 — Server vs client date mismatch (India: UTC+5:30)**
- `getMinimumLogDate` and `validateLogDateForCadence` must use the same epoch reference as
  the picker. The canonical rule: log date comparison is date-only (YYYY-MM-DD), stripped of
  time component, in the device's local timezone. Store the log date as a UTC timestamp but
  compare as local date.

### 4c. Offline and sync edge cases

**OFF-01 — Log recorded offline, synced the next calendar day**
- The log date is the timestamp when the user tapped "Log" — not the sync timestamp.
- Validation at sync time must accept a log date of yesterday if it was valid at the time of
  recording.
- Implementation: store `loggedAt` (device local date) separately from `syncedAt`. Validate
  against `loggedAt`.

**OFF-02 — Two devices log the same dose concurrently**
- Last-write-wins is acceptable, but only one completion must persist.
- The second sync must detect a duplicate (same `recordId` already completed) and discard
  the incoming log, not create a second completion.
- Test: simulate two concurrent completions for the same recordId; verify repository contains
  exactly one completed record afterward.

**OFF-03 — Reschedule sent offline; record already completed on server**
- A reschedule payload arriving for a record that is already `status: completed` must be
  silently dropped.
- Must not corrupt the timeline or generate a ghost open record.

### 4d. Notification reliability

**NOT-01 — Notification fires after dose already logged**
- When a dose is marked done, cancel all pending OS notifications for that recordId
  immediately. Do not wait for the next app launch.
- Test: mark done → query OS notification store → zero pending for that recordId.

**NOT-02 — App killed mid-reschedule**
- The cancel step and the reschedule step must be idempotent.
- On next launch, if a reschedule was partially applied, the app must reconcile: cancel any
  stale notification for the old date, re-register for the new date.
- Use a local journal / pending-operations queue so the reconciliation is deterministic.

**NOT-03 — Notification deep-link for a deleted record**
- Tapping a notification for a record that no longer exists must show a graceful "this record
  no longer exists" screen — never a crash.
- Test: create record → schedule notification → delete record → simulate notification tap →
  verify no crash, correct empty-state screen shown.

**NOT-04 — OS notification quota exhausted**
- iOS limits pending local notifications to 64. When the limit is reached, prioritise
  notifications in this order: overdue today > due this week > due this month > future.
- Test: generate 70 scheduled records; verify only 64 notifications are registered and they
  cover the soonest 64 due dates.

### 4e. Vaccination series — real-world gaps

**VS-01 — Partial series abandoned mid-way**
- Owner completes dose 1 but never returns. After 6 months the app must still show dose 2
  as overdue (not auto-completed, not auto-skipped, not re-bootstrapped from scratch).
- Do not regenerate the puppy series. Show the overdue state with the original `dueDate`.

**VS-02 — Dose logged out of series order**
- If a vet administers dose 3 before dose 2 is logged in the app, the app must warn the
  user: "Dose 2 has not been completed — are you sure you want to log dose 3?"
- Do not silently accept. Do not hard-reject. Surface a confirmation flow.

**VS-03 — Annual booster after series is complete**
- Completing the final dose in a puppy series must trigger generation of the annual booster
  row (different recordType), not re-generate the puppy series.
- Test: complete all puppy doses → verify no new puppy-series rows exist → verify one annual
  booster row exists with dueDate = final dose date + 365 days.

**VS-04 — Imported vaccination record (pre-app history)**
- User adds a past completion date before the app was installed. The `completedDate` is in
  the past, potentially before the app account was created.
- This must be accepted if it is ≥ DOB and ≤ today.
- Series state (which doses are done) must resolve correctly from the imported history.

**VS-05 — Three-plus dose dependency chain**
- Test a Leptospira-style series: dose 1 → dose 2 (`dependsOn` dose 1) → dose 3
  (`dependsOn` dose 2).
- Verify that completing dose 2 does not unlock dose 3 until dose 2's `completedDate` is
  set. Verify that dose 3's `minimumDate` = dose 2's `completedDate`.

### 4f. Deworming — real-world gaps

**DW-01 — Cadence changed after doses have been logged**
- If a vet prescribes a change from 3-month to 1-month cadence, the new cadence must
  anchor its spacing from the most recent completed dose, not from the original schedule
  start.
- Existing completed logs must not be invalidated.
- Future open rows must be recomputed under the new cadence.

**DW-02 — Lifestyle change (indoor → outdoor) mid-schedule**
- D-BOOT-02 covers re-bootstrap, but completed doses must survive the rebuild.
- Test: complete 2 doses → trigger lifestyle change → verify 2 completed rows still exist
  → verify only open/future rows are regenerated.

**DW-03 — Puppy under minimum protocol age**
- Some deworming protocols start at 2 weeks, not at birth. A DOB guard alone is
  insufficient.
- Implement and test a `MIN_DEWORM_AGE_DAYS` constant (default: 14). First-dose window
  must be ≥ DOB + MIN_DEWORM_AGE_DAYS, not just ≥ DOB.

**DW-04 — Very long gap between doses (1+ year for a 3-month cadence)**
- The rolling lookback must reject a log that is more than `cadenceMonths × 2` months
  after the last completed dose, even if the date is after DOB and before today.
- This prevents accidentally logging a "current" dose when years of care have lapsed
  without a genuine medical justification for the gap.
- Recommended UX: reject with message "It looks like more than [X] months have passed.
  Please consult your vet before logging."

### 4g. Data integrity

**INT-01 — Repository returns records in non-chronological order**
- `getLastCompletedDose` must sort records by `completedDate` descending before taking
  the first element. Never trust insertion order.
- Test: insert 3 completed records in reverse chronological order → call
  `getLastCompletedDose` → verify it returns the most recent, not the most recently
  inserted.

**INT-02 — Duplicate completion records in store**
- Two identical logs for the same `recordId` (sync bug). Validation must be idempotent.
- The spacing check must de-duplicate before computing the last-completed baseline.
- Test: insert 2 identical completion records → log a new dose → verify spacing is computed
  from the deduplicated single last-completion, not double-counted.

**INT-03 — DOB stored as date-only vs datetime**
- `assertDateNotBeforePetDob` must compare dates as local calendar dates (YYYY-MM-DD),
  not as UTC timestamps.
- A DOB of "2024-03-01" stored as "2024-03-01T00:00:00Z" must not reject a log of
  "2024-03-01" when the device is in UTC+5:30 (which would see the DOB as "2024-03-01"
  but the UTC timestamp comparison would be "2024-02-29T18:30:00Z" < "2024-03-01").
- Canonical fix: strip time component from both sides before comparison.

**INT-04 — Vet record attachment does not affect date validation**
- Presence or absence of a PDF/photo attachment on a log must have no effect on date
  validation outcome.
- Test: log with no attachment → accept. Log with attachment → accept. Same log,
  attachment removed → accept.

**INT-05 — Schedule for a pet with no DOB set**
- If DOB is null, the bootstrap must not crash. It must either: (a) generate a
  date-neutral schedule with a warning, or (b) block schedule generation and prompt
  the user to add DOB first.
- Whichever behaviour is chosen, it must be the same at the UI layer and the use-case
  layer. Test both layers.

### 4h. UX / owner behaviour patterns

**UX-01 — Bulk-logging multiple missed doses in one session**
- Owner logs 3 missed deworming doses back-to-back (e.g. months 3, 6, 9 all in one
  session).
- Each submission must use the date the owner enters, not today's date.
- The spacing validation for dose N must use the date entered for dose N-1 (already
  submitted in this session), not the original last-completed dose from before the
  session.
- Implementation: after each successful log, refresh the `lastCompletedDate` baseline
  before validating the next submission.

**UX-02 — Log then immediately edit the date**
- User logs today, then edits to yesterday. The self-reference exclusion (D-LOG-09) must
  apply during edits, not just during initial log.
- The record being edited must be excluded from its own last-completion inference during
  the edit validation. Test the edit path explicitly.

**UX-03 — Undo / delete a completed log**
- Deleting the most recent completed dose must: (a) re-open that record, (b) recompute
  the schedule from the prior completed dose, (c) cancel any notifications that were
  based on the deleted completion's date, (d) reschedule notifications from the
  recomputed dates.
- Test: complete dose → delete completion → verify record is open again → verify next
  due date is recomputed → verify notifications are updated.

**UX-04 — Adult rescue pet with approximate DOB**
- Rescue pets often have DOB set to the first of the month (e.g. "2022-05-01" meaning
  "born sometime in May 2022").
- The app must accept an approximate DOB and not produce invalid due dates.
- Test: set DOB = first of month → bootstrap schedule → verify all due dates are valid
  calendar dates ≥ DOB → verify log picker minimum date is reachable.

---

## 5. Implementation rules the agent must follow

### Date arithmetic rules
```
RULE-DATE-01: Always compare dates as YYYY-MM-DD strings in the device's local timezone.
              Strip the time component before any < / > / === comparison.

RULE-DATE-02: Use calendar-day arithmetic for spacing, not raw millisecond diffs.
              Millisecond diffs fail on DST boundaries. Use a date library's
              daysBetween(a, b) that is DST-aware.

RULE-DATE-03: "Today" is always the local calendar date of the device.
              Never use new Date().toISOString().slice(0,10) — that is UTC date.
              Use localDateString(new Date()) that respects device timezone.

RULE-DATE-04: DOB comparison: strip time from both DOB and log date before comparing.
              Never compare a date-only DOB string against a full ISO timestamp directly.

RULE-DATE-05: Spacing checks must use getMinimumLogDate() — never inline the arithmetic.
              This ensures a single source of truth for the rolling lookback rule.
```

### Validation layer rules
```
RULE-VAL-01: Every validation in the UI picker (minimumDate / maximumDate) must have a
             corresponding guard in the use-case layer (MarkSmartHealthRecordDone,
             RescheduleSmartHealthRecord). The UI is defence-in-depth, not the only gate.

RULE-VAL-02: getLastCompletedDose() must always sort by completedDate before returning.
             It must exclude the current recordId (self-reference exclusion).
             It must deduplicate if multiple records share the same completedDate.

RULE-VAL-03: Bootstrap (BootstrapSmartHealthSchedule) must never overwrite completed
             records. Only open/future records may be regenerated.

RULE-VAL-04: All validation functions must be pure (no side effects, no network calls).
             They take date inputs and return a result object: { valid: boolean, reason?: string }.

RULE-VAL-05: Validation error messages must be user-facing (no internal codes). They must
             include the relevant date in human-readable format so the user understands
             why the log was rejected.
```

### Notification rules
```
RULE-NOT-01: Every write to a SmartHealthRecord that changes its dueDate or status must
             atomically: (1) cancel the old notification for that recordId, then
             (2) register the new notification. Both steps in a single transaction.

RULE-NOT-02: On app launch, reconcile the notification store: for every pending OS
             notification, verify the corresponding record still exists and is still open.
             Cancel any notification whose record is completed, deleted, or rescheduled.

RULE-NOT-03: Notification deep-link handler must guard against missing records.
             Pattern: navigate to record → if not found → show empty state → do not crash.

RULE-NOT-04: Respect OS notification quota (iOS: 64). Prioritise by due date ascending.
             Drop the furthest-future notifications when over quota.
```

### Sync and offline rules
```
RULE-SYNC-01: Log date = the local date the user tapped "Log", stored as loggedAt.
              Sync date = the UTC timestamp when the record reached the server, stored as syncedAt.
              Validation always uses loggedAt, never syncedAt.

RULE-SYNC-02: Idempotency — every write operation must be safe to replay.
              Duplicate completions for the same recordId must be de-duplicated, not
              double-applied.

RULE-SYNC-03: A reschedule payload for a record with status: completed must be a no-op.
              Log a warning but do not corrupt the record.
```

---

## 6. Test file targets

```bash
# Run the full health record test suite
yarn test DewormingEngine.test.ts \
          healthRecordDateGuards.test.ts \
          vaccinationLogValidation.test.ts \
          MarkSmartHealthRecordDone.test.ts \
          RescheduleSmartHealthRecord.test.ts \
          BootstrapSmartHealthSchedule.test.ts \
          smartHealthRecordStore.test.ts

# New test files to create for the gaps above
# (one file per domain area)
yarn test offlineSync.test.ts       # OFF-01, OFF-02, OFF-03
yarn test notificationReliability.test.ts  # NOT-01 through NOT-04
yarn test dateTimezone.test.ts      # TZ-01 through TZ-04
yarn test multiPetIntegrity.test.ts # MP-01 through MP-04
yarn test dataIntegrity.test.ts     # INT-01 through INT-05
yarn test ownerBehaviourPatterns.test.ts   # UX-01 through UX-04
```

---

## 7. Agent checklist before marking any task done

Before closing any issue related to health record validation, the agent must confirm:

- [ ] The use-case layer enforces the same rule as the UI layer (RULE-VAL-01).
- [ ] `getLastCompletedDose` sorts, excludes self, and deduplicates (RULE-VAL-02).
- [ ] Date comparisons use local calendar date, not UTC timestamp (RULE-DATE-01).
- [ ] Spacing arithmetic uses the date library's DST-aware daysBetween, not millisecond diff (RULE-DATE-02).
- [ ] Bootstrap does not overwrite any completed records (RULE-VAL-03).
- [ ] Notification cancel + reschedule happens atomically on every date/status change (RULE-NOT-01).
- [ ] The new test covers both the happy path and the specific rejection condition.
- [ ] The test uses a real timezone offset (UTC+5:30 is the target production timezone for
      Indian users) not just UTC.
- [ ] No existing test in the matrix (Section 3) has been regressed.
