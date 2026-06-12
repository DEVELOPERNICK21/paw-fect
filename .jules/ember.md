# Ember Journal 🔥

Crash triage and stability learnings for Pet Perfect.

## 2025-05-15 - RangeError: Invalid time value in toISOString()

**Crash:** Calling `.toISOString()` on a `Date` object that is "Invalid Date" (e.g. from `new Date(NaN)` or malformed date math) throws a fatal `RangeError: Invalid time value`. This was observed in notification scheduling and UI view models.

**Learning:** React Native apps frequently crash when background tasks or selectors perform date math on null/undefined fields that haven't been properly guarded at the Domain layer.

**Prevention:** Always use `safeToIsoString` or check `!isNaN(date.getTime())` before calling `.toISOString()`.

**Fix:**
- Introduced `isValidDate` and `safeToIsoString` helpers in `src/shared/utils/calendarDate.ts`.
- Applied `safeToIsoString` in `src/infrastructure/notifications/notifeeNotificationService.ts` for safe logging/triage.
- Hardened `pickRecentCompleted` in `src/modules/pets/domain/usecases/BuildPetHealthCardViewModel.ts` to prevent view model crashes.

## 2025-05-22 - Infinite Loop and RangeError in Date Calculation Loops

**Crash:** When date arithmetic (like `addMonths`) fails due to malformed input, it can return the same "Invalid Date" string. If this occurs inside a `while (cursor <= cap)` loop, the loop never terminates, leading to an app hang or "Invalid array length" error if the loop appends to an array.

**Learning:** Safeguarding `.toISOString()` with `isValidDate` is the first line of defense, but loops that depend on date progression must also have iteration guards.

**Prevention:** Always use a loop guard (e.g., `guard < 100`) when iterating based on calculated dates.

**Fix:**
- Applied `safeToIsoDate` and loop guards to `DewormingEngine.ts`, `DewormingTimelineEngine.ts`, and `SmartHealthScheduleUtils.ts`.
