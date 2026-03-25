# System Context

Project Name: Pet Perfect

Pet Perfect is a React Native mobile application for managing pet care with an offline-first architecture.

---

## Core Features

- Pet Profiles
- Reminders (vaccination, medication, grooming, custom)
- Health Records
- Notifications
- Offline-first sync system

---

## Tech Stack

- React Native
- TypeScript (strict)
- Zustand
- SQLite
- Clean Architecture
- Feature-first structure

---

## Architecture Overview

### Command Flow

UI → Store → UseCase → Repository → DataSource → Infrastructure

### Reactive Flow

Repository → UseCase → Store → UI

---

## Core Principles

---

### 1. Single Source of Truth (SSOT)

Repositories manage:

- Local DB
- API
- Cache
- Sync logic

Store is NOT a source of truth.

---

### 2. Offline-First System

- Local DB is primary
- UI reads only from local DB
- Writes happen locally first
- Background sync with server

---

### 3. Sync System

- Queue-based sync
- Retry failed operations
- Track sync state
- Conflict resolution: Last Write Wins

---

### 4. Reactive Architecture

- UI reacts to data changes
- Observer UseCases emit updates
- Stores update ViewModels
- No manual refresh dependency

---

### 5. Application Orchestration

AppOrchestrator handles:

- App initialization
- Refresh flows
- Logout cleanup
- Cross-feature coordination

---

## Module Structure

All features live in:

src/modules/

Each module contains:

- domain
- data
- store
- ui

---

## Database Strategy

Primary DB: SQLite

Tables:

- pets
- reminders
- health_records
- sync_queue

---

## Storage Strategy

- SQLite → structured data
- MMKV → lightweight storage

---

## Scalability Strategy

Supports:

- New modules
- Large datasets
- Multi-device sync
- Background processing

---

## Development Philosophy

- Strict separation of concerns
- Feature isolation
- Reactive data flow
- Testable domain logic
- Scalable architecture

---

## UI Architecture Rules

---

### UI Responsibilities

- Render data from store
- Trigger store actions
- Display loading/error states

---

### Forbidden in UI

- No business logic
- No API calls
- No DB access
- No ViewModel building
- No use case calls

---

### UI Data Flow

UI → Store → UseCase → Repository

---

### Component Rules

- Screens = smart (via store only)
- Components = dumb
- Reusable and stateless

---

### State Handling

UI handles only:

- loading
- error
- empty

---

### Performance

- FlatList usage
- Memoization
- Avoid unnecessary re-renders

---

### Styling

- Centralized design system
- No random styles
- Consistent spacing

---

### Navigation

- UI layer only
- No navigation outside UI

---

## Composite UseCases

Allowed to:

- Combine multiple repositories
- Build ViewModels
- Act as domain-level aggregators

---

## Final Principle

UI does not think.
Store does not decide.
Domain defines logic.
Data owns truth.
