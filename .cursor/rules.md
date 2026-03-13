# Architecture Rules

The project follows strict architectural rules that must never be violated.

---

Architecture Layers

The application follows Clean Architecture.

Dependency direction must always be:

UI → Store → UseCase → Repository → DataSource → Infrastructure

No layer may import from a higher layer.

Forbidden examples:

UI → API
UI → Storage
Domain → React
Domain → API

---

Feature Module Structure

All features must live inside:

src/modules/<feature>

Each feature must follow this structure:

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

Feature logic must not be placed outside its module.

---

Domain Layer Rules

Domain layer must contain only pure TypeScript logic.

It must not depend on:

React
React Native
State management libraries
API libraries
Storage libraries

Domain contains:

models
repository interfaces
use cases

---

Data Layer Rules

Data layer implements repository interfaces.

Responsibilities:

- API communication
- local storage
- caching
- data transformation

Repositories are the Single Source of Truth.

UI must never call APIs directly.

---

State Management Rules

Zustand is used for state management.

Rules:

Stores hold application state.

Stores must not contain API calls.

Stores should interact with use cases or repositories.

UI components read state through store hooks.

---

UI Layer Rules

UI layer contains:

screens
components

Rules:

UI must be presentation only.

UI must not contain business logic.

UI must not call APIs.

UI must trigger actions through stores or use cases.

---

Infrastructure Layer

Infrastructure contains shared services.

Examples:

API client
storage service
notification scheduling

Infrastructure must not depend on feature modules.

---

Naming Conventions

Model: Reminder.ts
Repository interface: ReminderRepository.ts
Repository implementation: ReminderRepositoryImpl.ts
Use case: CreateReminder.ts
Store: reminderStore.ts
Screen: ReminderListScreen.tsx
Component: ReminderCard.tsx

---

Code Quality Rules

Use TypeScript strict typing.

Avoid using "any".

Functions should be small and focused.

Business logic must never be placed inside UI components.

---

When generating new features, always follow this process:

1. Create domain models.
2. Define repository interfaces.
3. Implement use cases.
4. Implement repository logic.
5. Create state store.
6. Implement UI screens and components.
