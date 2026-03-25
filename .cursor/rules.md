# Architecture Rules (STRICT)

These rules are mandatory and must never be violated.

---

## 1. Dependency Flow

### Command Flow

UI → Store → UseCase → Repository Interface → Repository Implementation → DataSource → Infrastructure

### Read / Reactive Flow

Repository → UseCase (ViewModel Builder / Observer) → Store → UI

---

## 2. Forbidden Dependencies

- UI → UseCase ❌
- UI → Repository ❌
- UI → API / Storage ❌
- Store → Repository ❌
- Store ↔ Store ❌
- Domain → React / Zustand / API / Storage ❌
- Data → UI ❌
- Infrastructure → Feature Modules ❌

---

## 3. Feature Module Structure

All features must live inside:

src/modules/<feature>/

Structure:

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

No feature logic outside its module.

Cross-feature interaction allowed ONLY via:

- UseCases
- App Orchestrator

---

## 4. Layer Responsibilities

---

### UI Layer

- Pure presentation
- No business logic
- No API calls
- Interacts ONLY with Store

Allowed:

- Navigation
- Minimal formatting

---

### Store Layer (Application Layer)

Zustand-based

#### Store Types

1. Command Store

- Calls UseCases
- Handles loading/error
- Holds minimal UI state

2. Projection Store

- Holds ViewModels
- Does NOT call UseCases
- Updated by orchestrator or observers

Forbidden:

- No API calls
- No Repository access
- No business logic

---

### Domain Layer

- Pure TypeScript
- Contains:

  - Models
  - Repository Interfaces
  - UseCases

#### UseCase Types

- Command UseCase (write operations)
- Query UseCase (read operations)
- Composite UseCase (combine multiple repositories)
- Observer UseCase (reactive updates)

Forbidden:

- No React / Zustand / API / Storage
- No external libraries

---

### Data Layer

Implements Repository Interfaces

Responsibilities:

- API calls
- Local DB operations
- Caching
- Sync logic
- Conflict resolution

This is the Single Source of Truth (SSOT)

---

### DataSource Layer

Handles:

- Remote API
- Local database

No business logic.

---

### Infrastructure Layer

Shared services:

- API Client
- SQLite
- Notification service
- Secure storage

Must not depend on feature modules.

---

## 5. Application Orchestrator (MANDATORY)

Responsible for:

- App initialization
- Refresh flows
- Logout handling
- Coordinating multiple use cases
- Updating projection stores

Rules:

- Can call multiple UseCases
- Can update stores
- No business logic
- No UI access

---

## 6. Data Flow Rules

### Command

UI → Store → UseCase → Repository → DataSource

### Reactive

Repository → UseCase → Store → UI

UI must never:

- Combine multiple data sources
- Build ViewModels

---

## 7. Offline-First Rules

- Local DB is primary source
- Writes go to local DB first
- Sync happens in background
- UI must not depend on API

---

## 8. Sync Rules

- Maintain sync queue
- Retry failed operations
- Track:

  - isSynced
  - updatedAt

- Conflict strategy: Last Write Wins

---

## 9. State Management Rules

- Zustand is mandatory
- Store must be minimal

Allowed:

- ViewModels
- Cached subsets

Forbidden:

- Uncontrolled duplication of raw DB entities

Store is NOT a source of truth.

---

## 10. Reactivity Rules

- UI must update automatically when data changes
- Observer UseCases handle subscriptions

Example:
ObserveDashboard → Store → UI

No manual polling.

---

## 11. Performance Rules

- Indexed queries (petId, date)
- Avoid full scans
- Use pagination when needed
- Optimize FlatList
- Memoize components

---

## 12. Naming Conventions

Model: Pet.ts
Repository Interface: PetRepository.ts
Repository Impl: PetRepositoryImpl.ts
UseCase: CreatePet.ts
Store: petStore.ts
Screen: PetListScreen.tsx
Component: PetCard.tsx

---

## 13. Code Quality

- TypeScript strict mode
- No "any"
- Small focused functions
- No business logic in UI

---

## 14. Feature Development Flow

1. Define models
2. Define repository interfaces
3. Create use cases
4. Implement repository
5. Implement DB schema
6. Add sync logic
7. Create stores (command + projection)
8. Add orchestrator (if needed)
9. Build UI
