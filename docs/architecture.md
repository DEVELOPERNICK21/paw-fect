### Dependency Rules

Dependencies must always flow downward:

UI → Store → UseCase → Repository → DataSource → Infrastructure

Forbidden dependency directions:

- UI → API
- UI → Storage
- Domain → React
- Domain → Infrastructure
- Feature → Feature

This rule ensures that business logic remains independent from frameworks and external systems.

---

# Project Structure

The project uses a **feature-first architecture**.

```
src/

app/
  navigation/
  providers/

modules/
  auth/
  pets/
  reminders/
  records/
  settings/

infrastructure/
  api/
  storage/
  notifications/

shared/
  components/
  hooks/
  utils/
  theme/
  types/
```

---

# Feature Modules

Each feature lives inside `src/modules`.

A module behaves like a **mini-application** containing its own:

- domain logic
- data access
- state
- UI

Example module:

```
modules/reminders
```

```
domain/
  models/
  repositories/
  usecases/

data/
  repositories/
  datasources/

store/

ui/
  screens/
  components/
```

This structure ensures that each feature remains isolated and maintainable.

---

# Domain Layer

The domain layer represents the **core business logic** of the application.

It contains:

- Models
- Repository interfaces
- Use cases

Rules:

- Must be pure TypeScript
- Must not depend on React
- Must not depend on API or storage libraries
- Must not contain UI logic

Example:

```
domain/models/Reminder.ts
domain/repositories/ReminderRepository.ts
domain/usecases/CreateReminder.ts
```

---

# Data Layer

The data layer is responsible for **data persistence and retrieval**.

It contains:

- Repository implementations
- Data sources

Example:

```
data/repositories/ReminderRepositoryImpl.ts
data/datasources/ReminderRemoteDataSource.ts
data/datasources/ReminderLocalDataSource.ts
```

Responsibilities:

- API communication
- Local storage access
- Caching logic
- Data transformation

Repositories act as the **Single Source of Truth**.

---

# State Management

The application uses **Zustand** for state management.

Each feature can maintain its own store.

Example:

```
modules/reminders/store/reminderStore.ts
modules/pets/store/petStore.ts
```

Rules:

- Stores hold application state
- Stores must not contain API logic
- Stores interact with use cases or repositories
- UI components read state via store hooks

---

# UI Layer

The UI layer contains screens and components.

Example:

```
ui/screens/ReminderListScreen.tsx
ui/screens/AddReminderScreen.tsx
ui/components/ReminderCard.tsx
```

Rules:

- UI must contain presentation logic only
- UI must not contain business logic
- UI must not call APIs directly
- UI interacts with store actions

---

# Infrastructure Layer

Infrastructure contains shared services that interact with external systems.

Location:

```
src/infrastructure/
```

Examples:

```
api/apiClient.ts
storage/storageService.ts
notifications/notificationService.ts
```

Responsibilities:

- network requests
- device storage
- notification scheduling

Infrastructure must not depend on feature modules.

---

# Shared Layer

The shared layer contains reusable components and utilities used across modules.

Examples:

```
shared/components/Button.tsx
shared/components/Input.tsx
shared/utils/date.ts
shared/theme/colors.ts
```

Rules:

Shared must remain **small and generic**.

Shared must not contain:

- feature-specific logic
- repositories
- business rules

---

# Navigation Architecture

Navigation is managed using React Navigation.

High-level structure:

```
RootNavigator
```

```
AuthStack
  LoginScreen
  SignupScreen

OnboardingStack
  AddPetScreen

AppStack
  HomeScreen
  ReminderListScreen
  AddReminderScreen
  HealthRecordsScreen
  SettingsScreen
```

Screens belong to their respective feature modules.

---

# Data Models

Core models used in Pawsoul.

### User

```
id
email
createdAt
```

### Pet

```
id
name
type
dob
photo
userId
```

### Reminder

```
id
petId
title
type
date
repeat
notificationId
```

### Health Record

```
id
petId
title
date
notes
attachment
```

---

# MVP Feature Set

Pawsoul MVP includes the following features:

Authentication
Pet profiles
Reminder scheduling
Local notifications
Health records
Basic settings

Future features may include:

- vet booking
- pet community
- food recommendations
- premium subscription
- wearable integrations

---

# Architectural Principles

These principles must always be respected.

### Single Source of Truth

Repositories act as the single source of truth for application data.

### Feature Isolation

Features must not depend on other feature modules.

### Separation of Concerns

Each layer must have a single responsibility.

### Scalability

The architecture must allow new modules to be added without modifying existing modules.

---

# Development Workflow

When creating a new feature:

1. Create the feature module folder
2. Define domain models
3. Define repository interfaces
4. Implement use cases
5. Implement repository implementations
6. Create Zustand store
7. Implement UI screens and components

---

# Naming Conventions

Model → `Reminder.ts`
Repository Interface → `ReminderRepository.ts`
Repository Implementation → `ReminderRepositoryImpl.ts`
Use Case → `CreateReminder.ts`
Store → `reminderStore.ts`
Screen → `ReminderListScreen.tsx`
Component → `ReminderCard.tsx`

---

# Code Quality Rules

- Use TypeScript strict typing
- Avoid `any`
- Keep functions small and focused
- Do not place business logic inside UI components
- Follow the defined architecture rules

---

# Final Principle

Architecture is not about folders.
It is about **dependency direction and clear responsibilities**.

If these rules are respected, Pawsoul can scale to a large codebase without becoming unmaintainable.
