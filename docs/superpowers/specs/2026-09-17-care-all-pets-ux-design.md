# Care All-Pets UX Redesign

**Date:** 2026-09-17  
**Status:** Implemented  
**Module:** `src/modules/schedule/`

## Principle

**All Pets is the default.** Individual pets are filters. Attention before schedule.

## Layers

| Piece | Role |
| --- | --- |
| `DailyScheduleEngine` | Unchanged — generates per-pet blocks |
| `careAggregator.ts` | Pure presentation merge/sort/filter |
| `scheduleStore.careSchedulesByPetId` | Loads all pets’ day schedules |
| `scheduleStore.careFilterPetId` | `all` \| petId |
| Completion SSOT | Existing `schedule_block_states` |

## Care hub UI

1. Filter chips: All pets / each pet  
2. Primary **Now / Overdue / All good** card (WHO + WHAT + WHEN + Done)  
3. **Up next** compact rows  
4. Progress: `N of M care tasks done today`  
5. **See full day** → DayView (chronological, respects filter)

## Tests

`careAggregator.test.ts` — multi-pet merge, filter, urgency sort, completion promotion, chronology.
