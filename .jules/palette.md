## 2025-05-22 - [Accessibility for Selection Chips]
**Learning:** In React Native, custom selection "chips" built with `Pressable` or `TouchableOpacity` often lack semantic state for screen readers. Users can't distinguish between selected and unselected options.
**Action:** Always apply `accessibilityRole="button"` and `accessibilityState={{ selected: isActive }}` to interactive toggle elements to ensure screen readers announce the state change correctly.

## 2025-10-14 - [Mobile Progress Indicator and Control Accessibility]
**Learning:** Legacy screens or multi-step wizards often lack semantic context for screen readers on progress bars and step indicators. Also, visual-only symbols (e.g., arrows like `→` or exit crosses like `✕`) in button text or icon-only buttons require descriptive, non-symbol-based equivalents for assistive tech.
**Action:** Apply `accessibilityRole="summary"` and dynamic `accessibilityLabel` (e.g., `Step ${current} of ${total}`) on progress/metric containers, and strip visual layout artifacts (e.g., arrow symbols) from `accessibilityLabel` text.
