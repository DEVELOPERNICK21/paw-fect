# Bolt ⚡ Performance Journal

## 2026-06-03 - Optimize SmartHealthRecordItem rendering
**Learning:** Frequently rendered list items like `SmartHealthRecordItem` in `HealthRecordScreen` contribute to UI jank if they re-render unnecessarily due to parent state changes or inline style allocations.
**Action:** Apply `React.memo` to `SmartHealthRecordItem` and use the project's memoized style factory pattern to reduce garbage collection pressure and re-render frequency.

## 2026-06-10 - Callback Stability in Lists
**Learning:** Even with `React.memo`, list items re-render if the parent passes inline arrow functions as callbacks. Per-item closures (e.g., `() => onPress(item)`) create new references on every parent render.
**Action:** Update child component callback signatures to pass the item/record back to the parent (e.g., `onPress: (item: T) => void`). This allows the parent to provide a single stable `useCallback` reference for all items in the list, effectively preventing re-renders.

## 2026-06-16 - Theme Hook Memoization
**Learning:** Unmemoized hooks that return objects (like `useTheme`) cause all downstream components and their memoized values (like `useMemo` styles) to re-evaluate on every render of the component using the hook, even if the underlying theme state is unchanged. This effectively breaks `React.memo` and `useMemo` downstream.
**Action:** Always memoize the return object of global hooks like `useTheme` to maintain reference stability across the entire component tree.
