# Pet Health System Documentation

## Overview

The Pet Health System provides automated deworming and vaccination scheduling for pets (dogs and cats). It follows a template-driven approach with age-based rules.

## Core Concepts

### 1. Health Task Types

- **Deworming**: Recurring parasitic treatment
- **Vaccination**: Immunization schedules (varies by pet type and age)

### 2. Schedule Status

| Status      | Description               |
| ----------- | ------------------------- |
| `pending`   | Task is upcoming or due   |
| `completed` | User marked as done       |
| `overdue`   | Past due date             |
| `skipped`   | User marked as not needed |

### 3. Urgency Levels

| Urgency     | Condition     | Color            |
| ----------- | ------------- | ---------------- |
| `overdue`   | Past due date | Red (#DC2626)    |
| `due_soon`  | Within 7 days | Yellow (#F59E0B) |
| `upcoming`  | Future task   | Green (#10B981)  |
| `completed` | Done          | Gray (#6B7280)   |

---

## Deworming Logic

### Default Frequency

| Pet Age                      | Frequency     |
| ---------------------------- | ------------- |
| < 12 weeks (puppies/kittens) | Every 14 days |
| ≥ 12 weeks (adults)          | Every 90 days |

### When Task is Completed

1. Calculate next due date = completion date + frequency
2. Update `lastCompletedDate`
3. Reset status to `pending`

### If Missed (Overdue)

- Show as `overdue` with red indicator
- Next due is recalculated from completion date, not original schedule
- User can mark complete or skip

---

## Vaccination Logic

### Dog Vaccination Templates

| Vaccine      | First Dose  | Series        | Adult Frequency |
| ------------ | ----------- | ------------- | --------------- |
| Rabies       | ≥ 12 weeks  | No            | Yearly          |
| DHPP (1st)   | 6-8 weeks   | Yes (4 doses) | Yearly          |
| DHPP (2nd)   | 9-12 weeks  | Yes           | -               |
| DHPP (3rd)   | 12-16 weeks | Yes           | -               |
| DHPP Booster | ≥ 16 weeks  | No            | Yearly          |

### Cat Vaccination Templates

| Vaccine     | First Dose  | Series        | Adult Frequency |
| ----------- | ----------- | ------------- | --------------- |
| Rabies      | ≥ 12 weeks  | No            | Yearly          |
| FVRCP (1st) | 6-8 weeks   | Yes (3 doses) | Yearly          |
| FVRCP (2nd) | 9-12 weeks  | Yes           | -               |
| FVRCP (3rd) | 12-16 weeks | No            | Yearly          |

### Series Vaccination Logic

- If pet is < 6 months: Generate multiple upcoming reminders (series)
- If pet is ≥ 6 months: Generate only next upcoming dose
- Track `seriesCompletedCount` and `totalSeriesDoses`

---

## File Structure

```
src/modules/records/
├── domain/
│   ├── models/
│   │   ├── HealthSchedule.ts          # Core types and interfaces
│   │   └── HealthScheduleTemplates.ts # Vaccine/deworming templates
│   └── utils/
│       └── HealthScheduleEngine.ts    # Scheduling logic
├── store/
│   └── healthScheduleStore.ts         # Zustand store
└── ui/
    └── components/
        └── HealthTaskCard.tsx         # Task display component
```

---

## Usage

### Initialize Schedules for New Pet

```typescript
import { useHealthScheduleStore } from '../store/healthScheduleStore';

const store = useHealthScheduleStore();

// When adding a new pet
await store.initializeSchedulesForPet(
  petId,
  petType, // 'dog' | 'cat'
  birthDate, // Optional: ISO date string
);
```

### Mark Task as Complete

```typescript
await store.completeSchedule(scheduleId, completedDate);
```

### Get Tasks by Urgency

```typescript
const overdue = store.getOverdueTasks();
const today = store.getTodayTasks();
const upcoming = store.getUpcomingTasks();
```

---

## Edge Cases Handled

1. **Unknown age**: Use adult frequency
2. **Missed cycles**: Next due recalculated from completion
3. **Multiple cycles skipped**: Recalculate from most recent completion
4. **Offline completion**: Store locally, sync later
5. **Duplicate prevention**: Check existing schedules before creating

---

## TODO

- [ ] Replace in-memory storage with MMKV/AsyncStorage
- [ ] Add backend sync for offline-first
- [ ] Create dedicated HealthScheduleScreen
- [ ] Add notification integration
- [ ] Add streak/continuity tracking
