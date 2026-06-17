# Bolt ⚡ Performance Journal

## 2026-06-03 - Optimize SmartHealthRecordItem rendering
**Learning:** Frequently rendered list items like `SmartHealthRecordItem` in `HealthRecordScreen` contribute to UI jank if they re-render unnecessarily due to parent state changes or inline style allocations.
**Action:** Apply `React.memo` to `SmartHealthRecordItem` and use the project's memoized style factory pattern to reduce garbage collection pressure and re-render frequency.

## 2026-06-10 - Callback Stability in Lists
**Learning:** Even with `React.memo`, list items re-render if the parent passes inline arrow functions as callbacks. Per-item closures (e.g., `() => onPress(item)`) create new references on every parent render.
**Action:** Update child component callback signatures to pass the item/record back to the parent (e.g., `onPress: (item: T) => void`). This allows the parent to provide a single stable `useCallback` reference for all items in the list, effectively preventing re-renders.

## 2026-06-17 - Memoize useTheme for stable hook references
**Learning:** The `useTheme` hook returned a new object on every render, causing all downstream `useMemo` and `useCallback` hooks depending on 'theme' to invalidate across the entire app (180+ components).
**Action:** Always wrap theme hook return values in `useMemo`. Additionally, pre-calculate theme-dependent constants like `shadows` outside the hook to maintain reference stability even when the hook is re-called.
