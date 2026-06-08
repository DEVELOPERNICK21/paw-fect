# Bolt ⚡ Performance Journal

## 2026-06-03 - Optimize SmartHealthRecordItem rendering
**Learning:** Frequently rendered list items like `SmartHealthRecordItem` in `HealthRecordScreen` contribute to UI jank if they re-render unnecessarily due to parent state changes or inline style allocations.
**Action:** Apply `React.memo` to `SmartHealthRecordItem` and use the project's memoized style factory pattern to reduce garbage collection pressure and re-render frequency.
