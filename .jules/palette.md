## 2025-05-22 - [Accessibility for Selection Chips]
**Learning:** In React Native, custom selection "chips" built with `Pressable` or `TouchableOpacity` often lack semantic state for screen readers. Users can't distinguish between selected and unselected options.
**Action:** Always apply `accessibilityRole="button"` and `accessibilityState={{ selected: isActive }}` to interactive toggle elements to ensure screen readers announce the state change correctly.

## 2025-05-24 - [Semantic Labels for Icon-only Buttons]
**Learning:** Icon-only buttons using symbols like "✕" or "←" are often read literally by screen readers (e.g., "multiplication sign"). This provides zero context for non-visual users.
**Action:** Always provide a descriptive `accessibilityLabel` (e.g., "Close onboarding", "Go back") to icon-buttons to convey the intended action clearly to assistive technologies.
