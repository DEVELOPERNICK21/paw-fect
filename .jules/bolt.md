# Bolt ⚡ Performance Journal

This journal records critical learnings about performance optimizations in the Pet Perfect (Paw-fect) codebase.

## Guidelines
- Focus on measurable wins.
- Avoid micro-optimizations that sacrifice readability without clear gain.
- Document why an optimization was chosen and its impact.

## 2025-05-15 - Memoization in "Hot" List Screens
**Learning:** Screens like `HealthRecordScreen` that manage complex state (modals, success timers, category tabs) cause frequent re-renders of the entire component tree. List items (`SmartHealthRecordItem`) and derived display arrays created via `.filter()` or `.slice()` in the render path are major sources of wasted work.
**Action:** Always wrap frequently used list items in `React.memo` and memoize derived display arrays using `useMemo` to ensure stable references for child components, especially when passed to `FlatList` or memoized children.
