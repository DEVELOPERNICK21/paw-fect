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
