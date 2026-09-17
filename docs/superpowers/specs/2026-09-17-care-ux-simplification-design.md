# Care Section UX Simplification — Design

**Date:** 2026-09-17  
**Status:** Approved for implementation (product spec provided by user)  
**Module:** `src/modules/schedule/` (existing feature — not a new `features/care/` tree)

## Goal

Care answers: **“What does my pet need me to do now?”**  
UX: NOW → NEXT → LATER. Keep `DailyScheduleEngine`; unify completion SSOT.

## Architecture (rules.md)

```
UI → Store → UseCase → Repository → DataSource
```

| Responsibility | Owner |
| --- | --- |
| What exists today | `DailyScheduleEngine` via `BuildDailySchedule` |
| What user completed | `ScheduleRepository` → AsyncStorage `schedule_block_states` |
| Enrichment / hero / celebration | `wellnessStore` (projection only) |
| Streak / relaxed mode | MMKV behind same repository (not a second completion ledger) |

**Forbidden:** store↔store; UI→storage; dual done writes (MMKV tasks + AsyncStorage).

## Completion model

Extend `ScheduleCompletionRecord`:

```ts
{ completedAt: string | null; snoozedUntil: string | null; skippedAt: string | null }
```

`BuildDailySchedule` maps → `isCompleted` / `isSkipped` on blocks.  
Migrate MMKV `tasks_*` → block states once on build. Stop writing MMKV for done/skip.

## UX

- Hub: pet switcher + NOW card + Up next (1) + Later list + soft “N of M done” + See full day → `DayView`
- Labels: kid-simple action copy with pet name
- Home + Care both call `MarkCareBlockDone` / `SkipCareBlock` / `SnoozeCareBlock`

## Out of scope

Smart Health engines, CarePlanTemplates, renaming NotificationsTab route id.
