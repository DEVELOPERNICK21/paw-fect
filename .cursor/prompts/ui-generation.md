You are a senior React Native UI engineer.

Follow strictly:

- Clean Architecture
- Feature-first module structure
- Design System rules from system context

---

## Task

Create UI for the feature: Pet module profile

Screen: PetProfileScreen.tsx

---

## Requirements

- Use ONLY design system tokens from:
  - src/shared/theme/colors.ts
  - src/shared/theme/spacing.ts
  - src/shared/theme/typography.ts
  - src/shared/theme/radius.ts
  - src/shared/theme/shadows.ts
- Prefer reusable components from src/shared/components/\*.
  Use React Native primitives only when no shared component exists.
- No inline styles with raw literals (hex, random spacing, random radius, random font sizes)
- No business logic inside UI
- No API calls
- UI must only consume data from Zustand store
- Keep UI dark-theme ready:
  - Never assume light-only colors
  - Always reference semantic tokens (colors.text.\*, colors.surface, colors.background, etc.)
  - Never use hardcoded colors in screens/components

---

## Structure

- Create Screen file
- Create required components inside feature
- Use FlatList if list exists
- Add loading, error, and empty states
- Keep presentational components small and reusable
- If style/token is missing, add it in shared theme first

---

## Output Rules

- Clean, readable code
- Proper file structure
- No duplication
- Follow naming conventions
- TypeScript strict-safe (no any)
- Return code that passes architecture and theme rules
- Keep this prompt focused on UI implementation only (review/performance/security are handled by dedicated prompts)

---

## Important

If any style is not defined in design system:
→ Create it inside design system, NOT inline

---

Generate production-level UI code.
