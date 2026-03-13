# Paw-fect Development Workflow

## Purpose

This document defines how development should happen in the Paw-fect project.

The goal is to ensure:

- consistent architecture
- maintainable code
- predictable feature development
- safe use of AI tools like Cursor

All development must follow the workflow defined here.

---

# Core Principles

1. Feature-first development
2. Strict architecture boundaries
3. Incremental feature building
4. Code review before new features
5. AI treated as a junior developer

---

# Development Order

The Paw-fect MVP must be built in the following order.

1. Project foundation
2. Navigation system
3. Reminders feature
4. Pets feature
5. Authentication feature
6. Health records feature
7. Settings feature

This order prevents dependency conflicts.

---

# Feature Development Process

Every new feature must follow this sequence.

## Step 1 — Create Feature Module

Create a new folder in:

```
src/modules/<feature>
```

Example:

```
src/modules/reminders
```

Create the module structure:

```
domain/
data/
store/
ui/
```

---

## Step 2 — Define Domain Models

Define the core business models first.

Example:

Reminder
Pet
User
HealthRecord

Domain models must be pure TypeScript.

Rules:

- no React imports
- no API logic
- no storage logic

---

## Step 3 — Define Repository Interfaces

Repository interfaces define how data is accessed.

Example:

```
ReminderRepository
PetRepository
AuthRepository
```

Rules:

Repositories must define operations only.

Example:

- getReminders()
- createReminder()
- deleteReminder()

They must not contain implementation.

---

## Step 4 — Implement Use Cases

Use cases contain business logic.

Examples:

CreateReminder
GetReminders
CreatePet
LoginUser

Rules:

Use cases interact with repository interfaces.

Use cases must not access APIs directly.

---

## Step 5 — Implement Data Layer

The data layer implements repositories.

Example:

```
ReminderRepositoryImpl
ReminderRemoteDataSource
ReminderLocalDataSource
```

Responsibilities:

- API calls
- storage operations
- caching logic

Repositories act as the **Single Source of Truth**.

---

## Step 6 — Create State Store

Create a Zustand store for the feature.

Example:

```
reminderStore
petStore
authStore
```

Rules:

- store holds state
- store exposes actions
- store must not call APIs directly

---

## Step 7 — Implement UI

Create screens and components.

Example:

```
ReminderListScreen
AddReminderScreen
ReminderCard
```

Rules:

- UI must be presentation only
- UI must not contain business logic
- UI must not call APIs

UI interacts with stores.

---

# Using Cursor AI

Cursor should be treated like a junior developer.

Never ask Cursor to build the entire app in one prompt.

Instead generate code step by step.

Example sequence:

1. create module
2. generate domain models
3. generate repository interfaces
4. generate use cases
5. generate repository implementation
6. create store
7. build UI

---

# AI Prompt Guidelines

Prompts must:

- reference architecture rules
- request one feature at a time
- clearly define output

Bad prompt example:

"Build my entire app with reminders and pets."

Good prompt example:

"Create the reminders module following the architecture rules in .cursor/system.md and .cursor/rules.md."

---

# Code Review Checklist

Before committing code, verify:

- architecture layers are respected
- UI does not call APIs
- business logic is not inside components
- repository interfaces are implemented correctly
- TypeScript types are correct
- no `any` types used

---

# Git Workflow

Recommended branching strategy:

```
main
develop
feature/*
```

Example:

```
feature/reminders
feature/pets
feature/auth
```

Development flow:

1. create feature branch
2. implement feature
3. test locally
4. merge into develop

---

# Commit Guidelines

Commit messages should describe the change clearly.

Examples:

```
feat: add reminder domain models
feat: implement reminder repository
feat: create reminder store
feat: implement reminder list screen
```

Avoid vague commits like:

```
update code
fix stuff
changes
```

---

# Testing Strategy

Testing should focus on:

- use cases
- repositories
- utilities

UI tests should be minimal.

Business logic should be tested independently from UI.

---

# Handling New Features

When adding a new feature:

1. create module
2. follow domain → data → store → UI order
3. ensure no feature dependency violations
4. update documentation if needed

---

# Avoid These Common Mistakes

Do not:

- place API calls inside screens
- add business logic to components
- create large shared utility folders
- allow modules to depend on each other
- bypass repository layer

These mistakes cause architecture decay.

---

# Final Rule

The architecture must always remain predictable.

If a developer cannot understand where logic belongs within a few minutes, the system structure is failing.
