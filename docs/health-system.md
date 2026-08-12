# Pet Health System Documentation

> **OBSOLETE PATH — do not implement against this file.**  
> The in-memory `HealthScheduleEngine` / `healthScheduleStore` described below
> no longer exist. Live care scheduling is **Smart Health** (see below).

## Live SSOT (2026-08-12)

```
CarePlanTemplates (rules)
  → PetCareLifecycleEngine + DewormingEngine
    → SmartHealthRecord (Firestore + AsyncStorage cache)
      → smartHealthRecordStore → Health Records UI + notifications
```

Design: `docs/superpowers/specs/2026-08-12-smart-health-truth-kid-simple-design.md`  
Plan: `docs/superpowers/plans/2026-08-12-smart-health-truth-kid-simple.md`

### Obsolete dual-model (do not expand)

`DewormingSchedule` / `DewormingRecord` types plus `dewormingSelectors.ts` /
`recoveryMode.ts` are an unused parallel model. Cleanup is a later PR.

---

## Historical notes (outdated)

The sections below are kept only for archaeology. Prefer Smart Health docs and
tests under `src/modules/records/`.

### Old overview

Automated deworming and vaccination scheduling for dogs and cats using
template-driven age rules — now implemented via `CARE_PLAN_TEMPLATES` and
`PetCareLifecycleEngine`, not `HealthScheduleEngine`.
