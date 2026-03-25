# Design System - Pet Perfect (STRICT)

This design system must always be followed when generating UI.

---

## Core Principle

UI must be consistent, reusable, and token-based.

No hardcoded styles. No random values.
Dark theme compatibility is mandatory.

---

## Tokens

### Colors

Single source of truth:
- `src/shared/theme/colors.ts`

Use semantic tokens only. Current examples include:
- `colors.primary`, `colors.primaryDark`, `colors.primaryLight`, `colors.accent`
- `colors.background`, `colors.backgroundAlt`, `colors.surface`
- `colors.text.primary`, `colors.text.heading`, `colors.text.body`, `colors.text.secondary`, `colors.text.subdued`, `colors.text.inverse`
- `colors.border`, `colors.borderSubtle`
- `colors.input.placeholder`
- `colors.success`, `colors.warning`, `colors.danger`, `colors.info`

Dark-mode rule:
- Never use hex values directly in feature UI code.
- Never use token names that imply fixed brightness (for example: `whiteText`, `blackBg`).
- Add/extend semantic tokens in `colors.ts` so both light and dark themes can map to the same semantic meaning.

---

### Spacing Scale

Single source of truth:
- `src/shared/theme/spacing.ts`

Use `spacing.*` / `space()` only.

---

### Typography

Single source of truth:
- `src/shared/theme/typography.ts`

Use `fontSizes`, `fontFamilies`, `fontWeights`, and `textStyles`.

---

### Radius

Single source of truth:
- `src/shared/theme/radius.ts`

Use `radius.*` only.

---

### Shadows

Single source of truth:
- `src/shared/theme/shadows.ts`

Use theme shadows/tokens only.

---

## UI Rules

- Never use inline hex colors
- Never use random spacing/radius/typography values
- Always use design tokens
- Always reuse components
- Never couple UI to light mode assumptions
- Prefer semantic color tokens over brand hex values

---

## Required Base Components

- Text
- Button
- Card
- Input
- Screen Wrapper

---

## Component Rules

- Components must be reusable
- Components must be presentational
- No business logic inside components
- Prefer components from `src/shared/components/*`
- Use React Native primitives only when shared components do not fit

---

## Layout Rules

- Use consistent padding (lg or xl)
- Use spacing tokens for margin/gap
- Avoid nested unnecessary views

---

## Performance Rules

- Use FlatList for lists
- Use React.memo for components
- Avoid inline functions in render

---

## UI Behavior

- UI must only render data from store
- UI must not transform business data
- UI must not call APIs

---

## Goal

Generate clean, scalable, and consistent UI across the entire app.
