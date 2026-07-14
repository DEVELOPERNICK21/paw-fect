# Bolt ⚡ Performance Journal

## 2026-06-03 - Optimize SmartHealthRecordItem rendering
**Learning:** Frequently rendered list items like `SmartHealthRecordItem` in `HealthRecordScreen` contribute to UI jank if they re-render unnecessarily due to parent state changes or inline style allocations.
**Action:** Apply `React.memo` to `SmartHealthRecordItem` and use the project's memoized style factory pattern to reduce garbage collection pressure and re-render frequency.

## 2026-06-10 - Callback Stability in Lists
**Learning:** Even with `React.memo`, list items re-render if the parent passes inline arrow functions as callbacks. Per-item closures (e.g., `() => onPress(item)`) create new references on every parent render.
**Action:** Update child component callback signatures to pass the item/record back to the parent (e.g., `onPress: (item: T) => void`). This allows the parent to provide a single stable `useCallback` reference for all items in the list, effectively preventing re-renders.

## 2026-06-15 - Consolidate Zustand Subscriptions
**Learning:** Components with many individual `useStore` hooks (e.g., extracting 10+ properties) create a high number of store listeners, increasing subscription overhead and re-evaluation costs on every state change.
**Action:** Consolidate multiple individual hooks from the same store into a single call using an object selector wrapped in `useShallow`. This reduces the listener count and simplifies the component's hook profile.
