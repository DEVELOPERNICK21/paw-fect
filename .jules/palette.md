## 2025-05-22 - [Accessibility for Selection Chips]
**Learning:** In React Native, custom selection "chips" built with `Pressable` or `TouchableOpacity` often lack semantic state for screen readers. Users can't distinguish between selected and unselected options.
**Action:** Always apply `accessibilityRole="button"` and `accessibilityState={{ selected: isActive }}` to interactive toggle elements to ensure screen readers announce the state change correctly.
