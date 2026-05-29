## 2025-05-22 - [RangeError: Invalid time value in Date Utility]
**Crash:** Calling `.toISOString()` on an Invalid Date object (created from a malformed string) throws a RangeError, terminating the app.
**Learning:** Date math helpers (`addDays`, `addMonths`) were assuming input strings were always valid YYYY-MM-DD. Malformed data from the DB or external sources was bypassing early guards and crashing in the utility layer.
**Prevention:** Always check `!isNaN(d.getTime())` before calling `.toISOString()` in utility functions. Use a `safeToIsoDate` wrapper to provide a fallback (like the original input) instead of crashing the process.
