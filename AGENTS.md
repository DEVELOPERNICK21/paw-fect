# AGENTS.md

This file provides guidelines for AI agents operating in the Pawsoul codebase.

## Project Overview

Pawsoul is a React Native mobile app for managing pet care with:

- **Architecture**: Clean Architecture with Feature-First structure
- **State Management**: Zustand
- **Language**: TypeScript (strict mode)
- **Theme**: Dark/Light mode support with design tokens

---

## Build/Lint/Test Commands

### Installation

```bash
yarn install        # Install dependencies
```

### Running the App

```bash
yarn start          # Start Metro bundler
yarn android        # Run on Android
yarn ios            # Run on iOS
```

### Linting

```bash
yarn lint           # Run ESLint on entire codebase
```

### Testing

```bash
yarn test           # Run all tests
yarn test --watch   # Run tests in watch mode
yarn test <pattern> # Run specific test file (e.g., jest src/modules/pets/__tests__/GetPets.test.ts)
```

### Type Checking

```bash
npx tsc --noEmit    # Run TypeScript type checking
```

### iOS Setup (first clone)

```bash
bundle install                    # Install Ruby gems
bundle exec pod install           # Install CocoaPods dependencies
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** - no implicit any, strict null checks
- **No `any` types** - ESLint will error if used
- **Always use explicit return types** on exported functions

### Import Conventions

**Order (enforced by ESLint):**

1. React/Framework imports
2. Third-party library imports
3. Internal absolute imports (`@/` paths)
4. Relative imports

**Examples:**

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../models/User';
import { useTheme } from '../../../../shared/hooks/useTheme';
```

### Naming Conventions

| Type                      | Convention                     | Example                           |
| ------------------------- | ------------------------------ | --------------------------------- |
| Models                    | PascalCase                     | `Pet.ts`, `Reminder.ts`           |
| Repository Interface      | PascalCase + Repository suffix | `PetRepository.ts`                |
| Repository Implementation | PascalCase + Impl suffix       | `PetRepositoryImpl.ts`            |
| Use Cases                 | PascalCase verb phrase         | `CreatePet.ts`, `GetPets.ts`      |
| Store                     | camelCase + Store suffix       | `petStore.ts`, `authStore.ts`     |
| Screen                    | PascalCase + Screen suffix     | `PetProfileScreen.tsx`            |
| Component                 | PascalCase                     | `PetCard.tsx`, `ReminderList.tsx` |
| Hooks                     | camelCase with `use` prefix    | `useTheme.ts`, `useAuthStore`     |
| Styles                    | PascalCase + Styles suffix     | `LoginScreen.styles.ts`           |
| Constants                 | SCREAMING_SNAKE_CASE           | `MAX_RETRY_COUNT`, `API_TIMEOUT`  |

### Architecture Layers

```
UI → Store → UseCase → Repository → DataSource → Infrastructure
```

**Allowed dependencies:**

- UI can access: Store, Shared components
- Store can access: UseCases only (via module composition / `*Composition` roots — **not** repository implementations or other feature stores)
- UseCase can access: Repository interfaces (domain)
- Repository implementation can access: DataSources
- DataSource can access: Infrastructure
- Cross-feature coordination: UseCases, `AppOrchestrator`, composition roots, and shared session ports — **not** store-to-store imports

**Forbidden:**

- No direct API/storage calls from UI or Store
- No business logic in UI components
- No React imports in Domain layer
- No feature-to-feature UI/domain coupling (no UI importing another feature’s internals)

### Feature Module Structure

```
src/modules/<feature>/
├── domain/
│   ├── models/
│   ├── repositories/      # Interface only
│   └── usecases/
├── data/
│   ├── repositories/      # Implementations
│   └── datasources/
├── store/                 # Zustand store
└── ui/
    ├── screens/
    └── components/
```

### Error Handling

**Pattern for async operations in stores:**

```typescript
const action: () => Promise<void> = async () => {
  set({ loading: true, error: null });
  try {
    const result = await useCase.execute();
    set({ data: result, loading: false });
  } catch (error) {
    logUnexpectedError('[scope] action error', error);
    set({
      loading: false,
      error: resolveErrorMessage(error, 'Fallback message'),
    });
  }
};
```

**Error logging (dev only):**

```typescript
const logUnexpectedError = (scope: string, error: unknown): void => {
  if (!__DEV__) return;
  // Only log truly unexpected errors
  if (isExpectedError(error)) return;
  console.error(scope, error);
};
```

### Theme/Design Tokens

**NEVER use hardcoded values in feature UI.** Always use tokens:

```typescript
// Colors
const { colors } = useTheme();
colors.primary, colors.background, colors.text.heading;

// Spacing
const { spacing, space } = useTheme();
spacing.lg, space('md');

// Typography
const { textStyles } = useTheme();
textStyles.title, textStyles.caption;

// Radius
const { radius } = useTheme();
radius.md, radius.round;
```

### Styling Pattern

Use memoized style factories with theme parameters:

```typescript
const createStyles = ({ colors, spacing, radius }: ThemeParams) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
  });

export const MyComponent: React.FC<Props> = () => {
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  return <View style={styles.container}>...</View>;
};
```

### React Patterns

**Prefer named exports:**

```typescript
export const MyComponent: React.FC<Props> = () => { ... };
```

**Avoid default exports except for screen components.**

**Use functional components only.**

**State updates with functional form when new state depends on previous:**

```typescript
setCount(prev => prev + 1);
```

---

## Additional Guidelines

### Cursor Rules

See `.cursor/rules.md` and `.cursor/system.md` for detailed architecture rules.

### Design System

See `.cursor/system/design-system.md` for UI generation guidelines.

### Documentation

- Architecture: `docs/architecture.md`
- Development Workflow: `docs/development-workflow.md`

### Test Files

Place tests alongside source files:

```
src/modules/pets/domain/usecases/GetPets.ts
src/modules/pets/domain/usecases/__tests__/GetPets.test.ts
```

### Pre-commit Hooks

ESLint and Prettier run on commit. Configure your editor to format on save.

---

## Quick Reference

| Task            | Command                   |
| --------------- | ------------------------- |
| Run single test | `yarn test -- <path>`     |
| Check types     | `npx tsc --noEmit`        |
| Lint all        | `yarn lint`               |
| Format all      | `yarn prettier --write .` |
