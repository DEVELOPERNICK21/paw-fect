# Bolt ⚡ Performance Journal

## 2026-06-03 - Optimize SmartHealthRecordItem rendering
**Learning:** Frequently rendered list items like `SmartHealthRecordItem` in `HealthRecordScreen` contribute to UI jank if they re-render unnecessarily due to parent state changes or inline style allocations.
**Action:** Apply `React.memo` to `SmartHealthRecordItem` and use the project's memoized style factory pattern to reduce garbage collection pressure and re-render frequency.

## 2026-06-09 - Memoized style factories with dynamic parameters
**Learning:** When using the project's `createStyles` pattern with dynamic parameters (like icon colors or status-based backgrounds), it is critical to memoize those parameter objects themselves. Otherwise, the style factory dependency array triggers a recalculation and a new style object reference on every render, defeating `React.memo` on child components.
**Action:** Always wrap dynamic style parameter calculations (e.g., `iconShell`) in `useMemo` before passing them to the `createStyles` dependency array.
