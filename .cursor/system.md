# System Context

Project Name: Pet Perfect

Pet Perfect is a React Native mobile application that helps pet owners manage their pets' care.

Main features of the application:

- Pet profiles
- Reminders for vaccination, medication, grooming, and custom tasks
- Health records
- Notification scheduling
- Offline-first data handling

The application must be scalable, maintainable, and easy to extend with new features.

Technology stack:

- React Native
- TypeScript (strict mode)
- Zustand for state management
- Clean Architecture
- Feature-first module architecture

The project architecture follows a layered approach:

UI → Domain → Data → Infrastructure

Where:

UI
Screens and UI components.

Domain
Business logic, models, repository interfaces, and use cases.

Data
Repository implementations and data sources.

Infrastructure
External services such as APIs, storage, and notifications.

All features must be implemented as independent modules under:

src/modules/

Example module:

modules/reminders

Each feature module must contain its own domain, data, store, and UI layers.

The system must enforce the following principles:

- Single Source of Truth using repositories
- UI must never access APIs directly
- Business logic must exist in use cases
- State management must be handled using Zustand
- Code must remain modular and scalable

The architecture should support future scaling and additional modules like:

- pets
- health records
- analytics
- user profiles
- subscriptions

The system should prioritize maintainability, testability, and clear separation of responsibilities.
