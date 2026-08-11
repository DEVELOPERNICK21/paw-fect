# Notification Planner Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a central `NotificationPlanner` that ranks must-fire local notification candidates (reminders, smart health, daily schedule for all pets), enforces a global pending budget of 64, reconciles OS triggers, hardens deep links, and emits core analytics — while stopping automatic daily-routine OS scheduling.

**Architecture:** Feature pipelines become pure candidate builders. `NotificationPlanner.planAndApply` ranks by priority tiers P0–P3, slices to 64, diffs against pending trigger ids, cancels dropped/orphan managed ids (including lingering `routine-` / `wellness-digest-`), and schedules winners via `NotificationService`. `resyncAllLocalNotifications` and boot storage resync call one apply path. Incremental feature syncs cancel entity ids then trigger the same full must-fire plan.

**Tech Stack:** TypeScript, Jest, existing `@notifee/react-native`, Zustand stores, `trackEvent` analytics, React Navigation.

## Global Constraints

- Local Notifee only — no FCM / remote push in this plan.
- Global pending budget = **64** (iOS limit; same on Android).
- Must-fire kinds only: `reminder`, `smartHealth`, `dailySchedule`.
- Do **not** emit `dailyRoutine` or `wellnessDigest` candidates; cancel lingering ids with those prefixes on apply.
- Leave self-test id `pawfect-notification-test` unmanaged (do not cancel in reconcile).
- Keep existing sound/channel routing (`withNotificationSound`, etc.).
- No `Reminder.repeat` scheduling changes (still −24h / −1h / due candidates).
- Phase 2 (welcome in-app, routine/digest settings toggles) is **out of this plan**.
- Follow Clean Architecture: planner in `src/infrastructure/notifications/`; compositions gather domain data and call apply.
- Explicit return types on exported functions; no `any`.

**Spec:** `docs/superpowers/specs/2026-08-11-notification-strategy-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/infrastructure/notifications/notificationCandidate.ts` | Candidate type, managed kind/prefix helpers, priority assignment |
| Create: `src/infrastructure/notifications/__tests__/notificationCandidate.test.ts` | Priority + prefix tests |
| Create: `src/infrastructure/notifications/notificationPlanner.ts` | `selectCandidates`, `planAndApply` |
| Create: `src/infrastructure/notifications/__tests__/notificationPlanner.test.ts` | Cap, sort, diff apply tests |
| Create: `src/infrastructure/notifications/applyMustFireNotificationPlan.ts` | Gather must-fire candidates from inputs + call planner |
| Create: `src/infrastructure/notifications/__tests__/applyMustFireNotificationPlan.test.ts` | Integration of builders → select |
| Modify: `src/infrastructure/notifications/notificationService.ts` | Add `getTriggerNotificationIds(): Promise<string[]>` |
| Modify: `src/infrastructure/notifications/notifeeNotificationService.ts` | Implement trigger id listing |
| Modify: `src/infrastructure/notifications/reminderSchedule.ts` | Add `buildReminderNotificationCandidates`; keep cancel; stop direct multi-schedule from sync helpers used by resync (delegate to candidates) |
| Modify: `src/infrastructure/notifications/smartHealthNotificationSchedule.ts` | Add `buildSmartHealthNotificationCandidates` |
| Modify: `src/modules/schedule/data/notifications/scheduleNotificationSync.ts` | Add `buildScheduleNotificationCandidates`; remove local 64 slice (planner owns budget) |
| Modify: `src/infrastructure/notifications/resyncLocalNotifications.ts` | Must-fire plan only; no routine sync |
| Modify: `src/infrastructure/notifications/resyncLocalNotificationsFromStorage.ts` | Same; all pets’ schedules |
| Modify: `src/modules/reminders/remindersComposition.ts` | After CRUD sync, call must-fire apply (or cancel + apply) |
| Modify: `src/modules/records/recordsComposition.ts` | Health notification sync → must-fire apply |
| Modify: `src/modules/schedule/scheduleComposition.ts` | Schedule sync → must-fire apply (all pets on full resync) |
| Modify: `src/modules/pets/petComposition.ts` / `petStore.ts` | Stop scheduling routines on pet CRUD/resync (cancel routines for pet / rely on planner cleanup) |
| Modify: `src/infrastructure/notifications/notificationBootstrap.ts` | Tap analytics + smart health `focusRecordId` + missing guards |
| Modify: `src/app/navigation/types.ts` | `HealthRecords: { focusRecordId?: string } \| undefined` |
| Modify: `src/modules/records/ui/screens/HealthRecordScreen.tsx` | Read focus param; show missing banner when needed |
| Modify: `src/modules/settings/ui/screens/SettingsScreen.tsx` | Track enable/disable; optional copy “Notifications” (phase 1 OK) |
| Modify: existing unit tests under notifications / schedule as needed |

---

### Task 1: Candidate model + priority helpers

**Files:**
- Create: `src/infrastructure/notifications/notificationCandidate.ts`
- Create: `src/infrastructure/notifications/__tests__/notificationCandidate.test.ts`

**Interfaces:**
- Consumes: `NotificationPayload` from `./notificationService`
- Produces:
  - `export type NotificationCandidateKind = 'reminder' | 'smartHealth' | 'dailySchedule' | 'dailyRoutine' | 'wellnessDigest'`
  - `export type NotificationPriority = 0 | 1 | 2 | 3 | 4 | 5`
  - `export interface NotificationCandidate { id: string; kind: NotificationCandidateKind; petId: string | null; fireAt: Date; priority: NotificationPriority; payload: NotificationPayload }`
  - `export const GLOBAL_PENDING_NOTIFICATION_BUDGET = 64`
  - `export const MANAGED_TRIGGER_PREFIXES` / `PHASE1_CANCEL_EXTRA_PREFIXES` (`routine-`, `wellness-digest-`)
  - `export function isUnmanagedTriggerId(id: string): boolean` — true for `pawfect-notification-test`
  - `export function priorityForReminderLead(lead: '24h' | '1h' | 'due'): NotificationPriority`
  - `export function priorityForSmartHealthSlot(slot: 'd2' | 'due' | 'overdue'): NotificationPriority`
  - `export function priorityForDailySchedule(): NotificationPriority` → `2`

- [ ] **Step 1: Write the failing test**

```typescript
import {
  GLOBAL_PENDING_NOTIFICATION_BUDGET,
  isUnmanagedTriggerId,
  priorityForReminderLead,
  priorityForSmartHealthSlot,
  priorityForDailySchedule,
} from '../notificationCandidate';

describe('notificationCandidate', () => {
  it('exposes global budget 64', () => {
    expect(GLOBAL_PENDING_NOTIFICATION_BUDGET).toBe(64);
  });

  it('maps reminder leads to P1/P3', () => {
    expect(priorityForReminderLead('due')).toBe(1);
    expect(priorityForReminderLead('1h')).toBe(1);
    expect(priorityForReminderLead('24h')).toBe(3);
  });

  it('maps smart health slots to P0/P3', () => {
    expect(priorityForSmartHealthSlot('overdue')).toBe(0);
    expect(priorityForSmartHealthSlot('due')).toBe(0);
    expect(priorityForSmartHealthSlot('d2')).toBe(3);
  });

  it('maps daily schedule to P2', () => {
    expect(priorityForDailySchedule()).toBe(2);
  });

  it('treats self-test id as unmanaged', () => {
    expect(isUnmanagedTriggerId('pawfect-notification-test')).toBe(true);
    expect(isUnmanagedTriggerId('reminder-x-due')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/infrastructure/notifications/__tests__/notificationCandidate.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
import type { NotificationPayload } from './notificationService';

export type NotificationCandidateKind =
  | 'reminder'
  | 'smartHealth'
  | 'dailySchedule'
  | 'dailyRoutine'
  | 'wellnessDigest';

export type NotificationPriority = 0 | 1 | 2 | 3 | 4 | 5;

export interface NotificationCandidate {
  id: string;
  kind: NotificationCandidateKind;
  petId: string | null;
  fireAt: Date;
  priority: NotificationPriority;
  payload: NotificationPayload;
}

export const GLOBAL_PENDING_NOTIFICATION_BUDGET = 64;

/** Prefixes the planner may cancel when not selected. */
export const MANAGED_TRIGGER_PREFIXES = [
  'reminder-',
  'health-',
  'schedule-block-',
] as const;

/** Phase 1: always strip these so they cannot consume OS quota outside the planner. */
export const PHASE1_CANCEL_EXTRA_PREFIXES = [
  'routine-',
  'wellness-digest-',
] as const;

const UNMANAGED_IDS = new Set(['pawfect-notification-test']);

export function isUnmanagedTriggerId(id: string): boolean {
  return UNMANAGED_IDS.has(id);
}

export function priorityForReminderLead(
  lead: '24h' | '1h' | 'due',
): NotificationPriority {
  if (lead === '24h') {
    return 3;
  }
  return 1;
}

export function priorityForSmartHealthSlot(
  slot: 'd2' | 'due' | 'overdue',
): NotificationPriority {
  if (slot === 'd2') {
    return 3;
  }
  return 0;
}

export function priorityForDailySchedule(): NotificationPriority {
  return 2;
}

export function isManagedOrPhase1ExtraId(id: string): boolean {
  if (isUnmanagedTriggerId(id)) {
    return false;
  }
  return [...MANAGED_TRIGGER_PREFIXES, ...PHASE1_CANCEL_EXTRA_PREFIXES].some(
    prefix => id.startsWith(prefix),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test -- src/infrastructure/notifications/__tests__/notificationCandidate.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/notifications/notificationCandidate.ts \
  src/infrastructure/notifications/__tests__/notificationCandidate.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): add candidate model and priority helpers

EOF
)"
```

---

### Task 2: Extend NotificationService with trigger id listing

**Files:**
- Modify: `src/infrastructure/notifications/notificationService.ts`
- Modify: `src/infrastructure/notifications/notifeeNotificationService.ts`
- Modify: `src/infrastructure/notifications/__tests__/notifeeNotificationService.test.ts` (if present; else add listing coverage via planner mocks only)

**Interfaces:**
- Consumes: Notifee `getTriggerNotifications`
- Produces: `NotificationService.getTriggerNotificationIds(): Promise<string[]>`

- [ ] **Step 1: Write the failing test** (extend existing Notifee mock test or add a small interface test documenting the method exists on noop)

In `notificationService.ts` tests are light — add to planner tests in Task 3. For this task, add assertion in `notifeeNotificationService.test.ts` if the file mocks notifee; otherwise:

```typescript
// In notifeeNotificationService.test.ts (adapt to existing mocks)
it('lists trigger notification ids from notifee', async () => {
  // mock getTriggerNotifications → [{ notification: { id: 'reminder-1-due' } }]
  const ids = await service.getTriggerNotificationIds();
  expect(ids).toEqual(['reminder-1-due']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — `getTriggerNotificationIds` missing

- [ ] **Step 3: Implement**

Add to `NotificationService`:

```typescript
getTriggerNotificationIds(): Promise<string[]>;
```

`NoopNotificationService`: return `[]`.

`NotifeeNotificationService`:

```typescript
async getTriggerNotificationIds(): Promise<string[]> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    return triggers
      .map(row => row.notification?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch (error) {
    if (__DEV__) {
      console.warn('[NotifeeNotificationService] getTriggerNotificationIds failed', error);
    }
    return [];
  }
}
```

- [ ] **Step 4: Run tests**

Run: `yarn test -- src/infrastructure/notifications/__tests__/notifeeNotificationService.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/notifications/notificationService.ts \
  src/infrastructure/notifications/notifeeNotificationService.ts \
  src/infrastructure/notifications/__tests__/notifeeNotificationService.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): list pending trigger ids for planner reconcile

EOF
)"
```

---

### Task 3: NotificationPlanner select + planAndApply

**Files:**
- Create: `src/infrastructure/notifications/notificationPlanner.ts`
- Create: `src/infrastructure/notifications/__tests__/notificationPlanner.test.ts`

**Interfaces:**
- Consumes: `NotificationCandidate`, `GLOBAL_PENDING_NOTIFICATION_BUDGET`, `isManagedOrPhase1ExtraId`, `isUnmanagedTriggerId`, `NotificationService`
- Produces:
  - `export function selectCandidates(candidates: NotificationCandidate[], activePetId: string | null, budget?: number): NotificationCandidate[]`
  - `export interface PlanApplyResult { selected: NotificationCandidate[]; cancelledIds: string[]; scheduledIds: string[]; droppedByKind: Record<string, number> }`
  - `export async function planAndApply(options: { candidates: NotificationCandidate[]; activePetId: string | null; service: NotificationService; budget?: number }): Promise<PlanApplyResult>`

**Sort rules:** lower `priority` number first → sooner `fireAt` → active pet first → `id` ascending.

**Apply rules:**
1. `selected = selectCandidates(...)`
2. `pending = await service.getTriggerNotificationIds()`
3. Cancel every pending id where `isManagedOrPhase1ExtraId(id)` and id not in selected set
4. Schedule each selected payload via `service.scheduleNotification` (always re-schedule selected for simplicity, or skip if identical — re-schedule is OK)
5. Compute `droppedByKind` from candidates not selected

- [ ] **Step 1: Write the failing test**

```typescript
import { planAndApply, selectCandidates } from '../notificationPlanner';
import type { NotificationCandidate } from '../notificationCandidate';
import type { NotificationService } from '../notificationService';

function cand(
  partial: Partial<NotificationCandidate> & Pick<NotificationCandidate, 'id' | 'priority' | 'fireAt'>,
): NotificationCandidate {
  return {
    kind: 'reminder',
    petId: 'p1',
    payload: {
      id: partial.id,
      title: 't',
      body: 'b',
      scheduledDate: partial.fireAt,
      data: { kind: 'reminder' },
    },
    ...partial,
  };
}

describe('selectCandidates', () => {
  it('keeps P0 over P3 when over budget', () => {
    const many: NotificationCandidate[] = [];
    for (let i = 0; i < 60; i += 1) {
      many.push(
        cand({
          id: `health-r${i}-due`,
          kind: 'smartHealth',
          priority: 0,
          fireAt: new Date(Date.UTC(2030, 0, 1, 9, 0, 0) + i * 1000),
        }),
      );
    }
    for (let i = 0; i < 10; i += 1) {
      many.push(
        cand({
          id: `reminder-r${i}-24h`,
          priority: 3,
          fireAt: new Date(Date.UTC(2030, 0, 2, 9, 0, 0) + i * 1000),
        }),
      );
    }
    const selected = selectCandidates(many, 'p1', 64);
    expect(selected).toHaveLength(64);
    expect(selected.every(c => c.priority === 0)).toBe(true);
  });

  it('prefers active pet when priority and time tie', () => {
    const t = new Date('2030-06-01T12:00:00');
    const selected = selectCandidates(
      [
        cand({ id: 'a', petId: 'other', priority: 2, fireAt: t }),
        cand({ id: 'b', petId: 'active', priority: 2, fireAt: t }),
      ],
      'active',
      1,
    );
    expect(selected.map(c => c.id)).toEqual(['b']);
  });
});

describe('planAndApply', () => {
  it('cancels managed pending ids not selected and schedules winners', async () => {
    const scheduled: string[] = [];
    const cancelled: string[] = [];
    const service: NotificationService = {
      scheduleNotification: async payload => {
        scheduled.push(payload.id);
      },
      displayImmediateNotification: async () => {},
      cancelNotification: async id => {
        cancelled.push(id);
      },
      cancelAllNotifications: async () => {},
      getTriggerNotificationIds: async () => [
        'reminder-old-due',
        'routine-feed-p1',
        'pawfect-notification-test',
      ],
    };
    const t = new Date('2030-06-01T12:00:00');
    const result = await planAndApply({
      candidates: [cand({ id: 'reminder-new-due', priority: 1, fireAt: t })],
      activePetId: 'p1',
      service,
      budget: 64,
    });
    expect(result.scheduledIds).toEqual(['reminder-new-due']);
    expect(cancelled).toEqual(
      expect.arrayContaining(['reminder-old-due', 'routine-feed-p1']),
    );
    expect(cancelled).not.toContain('pawfect-notification-test');
    expect(scheduled).toEqual(['reminder-new-due']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/infrastructure/notifications/__tests__/notificationPlanner.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement `notificationPlanner.ts`**

Implement `selectCandidates` and `planAndApply` per interfaces above. Export explicit return types.

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/notifications/notificationPlanner.ts \
  src/infrastructure/notifications/__tests__/notificationPlanner.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): add planner select and reconcile apply

EOF
)"
```

---

### Task 4: Reminder candidate builder

**Files:**
- Modify: `src/infrastructure/notifications/reminderSchedule.ts`
- Modify: `src/infrastructure/notifications/__tests__/reminderSchedule.test.ts`

**Interfaces:**
- Consumes: `ReminderScheduleInput`, priority helpers, sound helpers
- Produces: `export function buildReminderNotificationCandidates(reminder: ReminderScheduleInput, nowMs?: number): NotificationCandidate[]`

Keep `cancelReminderNotifications`. `buildReminderNotificationCandidates` mirrors current −24h/−1h/due payload construction without calling the service. Leave `syncReminderNotifications` in place until Task 8 removes call sites; do not use it from resync after Task 7.

- [ ] **Step 1: Write the failing test**

```typescript
import { buildReminderNotificationCandidates } from '../reminderSchedule';

describe('buildReminderNotificationCandidates', () => {
  const reminder = {
    id: 'rem-1',
    petId: 'pet-1',
    title: 'Vaccination',
    date: '2030-06-15',
    time: '10:00',
  };

  it('returns 24h, 1h, and due candidates with priorities', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const candidates = buildReminderNotificationCandidates(reminder, nowMs);
    expect(candidates.map(c => c.id)).toEqual([
      'reminder-rem-1-24h',
      'reminder-rem-1-1h',
      'reminder-rem-1-due',
    ]);
    expect(candidates.map(c => c.priority)).toEqual([3, 1, 1]);
    expect(candidates.every(c => c.payload.id === c.id)).toBe(true);
  });

  it('returns no candidates when due time is in the past', () => {
    const nowMs = Date.parse('2030-06-16T00:00:00');
    expect(buildReminderNotificationCandidates(reminder, nowMs)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/infrastructure/notifications/__tests__/reminderSchedule.test.ts`

Expected: FAIL — `buildReminderNotificationCandidates` not exported

- [ ] **Step 3: Implement builder**

Add `buildReminderNotificationCandidates(reminder, nowMs = Date.now())` in `reminderSchedule.ts`: same parsing, lead windows, titles/bodies/data/`withNotificationSound` as today’s `syncReminderNotifications`, but push `NotificationCandidate` objects instead of calling `service.scheduleNotification`. Skip leads whose `fireAt <= nowMs + 1500`.

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/notifications/reminderSchedule.ts \
  src/infrastructure/notifications/__tests__/reminderSchedule.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): build reminder candidates without scheduling

EOF
)"
```

---

### Task 5: Smart health candidate builder

**Files:**
- Modify: `src/infrastructure/notifications/smartHealthNotificationSchedule.ts`
- Modify: `src/infrastructure/notifications/__tests__/smartHealthNotificationSchedule.test.ts`

**Interfaces:**
- Produces: `export function buildSmartHealthNotificationCandidates(record: SmartHealthRecord, petSpecies?: PetNotificationSpecies, nowMs?: number): NotificationCandidate[]`
- Produces: `export function buildSmartHealthCandidatesForRecords(records: SmartHealthRecord[], petSpeciesByPetId?: ReadonlyMap<string, PetNotificationSpecies>, nowMs?: number): NotificationCandidate[]` — uses existing `selectHealthRecordsForNotifications` then per-record builder

Skip completed/skipped. Same slots as today (d2/due/overdue @ 09:00). Priorities via `priorityForSmartHealthSlot`.

- [ ] **Step 1: Write the failing test**

```typescript
import { buildSmartHealthNotificationCandidates } from '../smartHealthNotificationSchedule';
import type { SmartHealthRecord } from '../../../modules/records/domain/models/SmartHealthRecord';

function baseRecord(overrides: Partial<SmartHealthRecord> = {}): SmartHealthRecord {
  return {
    id: 'rec-1',
    petId: 'pet-1',
    name: 'Rabies',
    type: 'vaccination',
    dueDate: '2030-06-15',
    status: 'upcoming',
    // fill remaining required SmartHealthRecord fields from fixtures/existing tests
    ...overrides,
  } as SmartHealthRecord;
}

describe('buildSmartHealthNotificationCandidates', () => {
  it('assigns P0 to due/overdue and P3 to d2', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const candidates = buildSmartHealthNotificationCandidates(
      baseRecord(),
      undefined,
      nowMs,
    );
    const byId = Object.fromEntries(candidates.map(c => [c.id, c.priority]));
    expect(byId['health-rec-1-d2']).toBe(3);
    expect(byId['health-rec-1-due']).toBe(0);
    expect(byId['health-rec-1-overdue']).toBe(0);
  });

  it('returns [] for completed records', () => {
    expect(
      buildSmartHealthNotificationCandidates(
        baseRecord({ status: 'completed' }),
        undefined,
        Date.parse('2030-06-01T00:00:00'),
      ),
    ).toEqual([]);
  });
});
```

Use a real `SmartHealthRecord` fixture from existing smart-health tests (copy required fields exactly — do not leave `as SmartHealthRecord` if the type is strict; match `smartHealthNotificationSchedule.test.ts` fixtures).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/infrastructure/notifications/__tests__/smartHealthNotificationSchedule.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement builders**

Extract slot payload construction from `scheduleSmartHealthDueNotifications` into `buildSmartHealthNotificationCandidates`. `buildSmartHealthCandidatesForRecords` uses `selectHealthRecordsForNotifications` then flattens per-record candidates.

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/notifications/smartHealthNotificationSchedule.ts \
  src/infrastructure/notifications/__tests__/smartHealthNotificationSchedule.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): build smart health candidates for planner

EOF
)"
```

---

### Task 6: Daily schedule candidate builder (no local 64 cap)

**Files:**
- Modify: `src/modules/schedule/data/notifications/scheduleNotificationSync.ts`
- Modify: `src/modules/schedule/data/notifications/__tests__/scheduleNotificationSync.test.ts` (create if missing)

**Interfaces:**
- Produces: `export function buildScheduleNotificationCandidates(schedule: DailySchedule, blocks: DailyCareBlock[], petSpecies?: PetNotificationSpecies, nowMs?: number): NotificationCandidate[]`

Filter: `reminderEnabled && !isCompleted`, future fire time. **Do not** `.slice(0, 64)` — planner caps globally.

Keep `cancelScheduleBlockNotification` for Done actions. Keep `syncScheduleNotifications` temporarily for Task 8 migration, but new builder must not apply a local 64 cap.

- [ ] **Step 1: Write the failing test**

```typescript
import {
  buildScheduleNotificationCandidates,
  scheduleNotificationId,
} from '../scheduleNotificationSync';
import type { DailyCareBlock } from '../../../domain/models/DailyCareBlock';
import type { DailySchedule } from '../../../domain/models/DailySchedule';

// Use minimal valid DailySchedule + DailyCareBlock fixtures from existing schedule tests.

describe('buildScheduleNotificationCandidates', () => {
  it('emits one P2 candidate per enabled incomplete block in the future', () => {
    const nowMs = Date.parse('2030-06-01T00:00:00');
    const schedule = {
      petId: 'pet-1',
      date: '2030-06-01',
      // ...required fields
    } as DailySchedule;
    const blocks = [
      {
        id: 'block-1',
        reminderEnabled: true,
        isCompleted: false,
        scheduledTime: '18:00',
        reminderMinutesBefore: 0,
        frequency: 'once',
        notificationTitle: 'Walk',
        notificationBody: 'Time',
        category: 'walk',
      },
    ] as DailyCareBlock[];

    const candidates = buildScheduleNotificationCandidates(
      schedule,
      blocks,
      undefined,
      nowMs,
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.id).toBe(scheduleNotificationId('pet-1', 'block-1'));
    expect(candidates[0]?.priority).toBe(2);
    expect(candidates[0]?.kind).toBe('dailySchedule');
  });

  it('does not locally cap at 64 (returns all future enabled blocks)', () => {
    // Build 70 future enabled blocks; expect length 70 from builder.
  });
});
```

Fill fixtures from real `DailyCareBlock` / `DailySchedule` types in-repo (copy from schedule store tests). Second example must construct 70 blocks and `expect(candidates.length).toBe(70)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test -- src/modules/schedule/data/notifications/__tests__/scheduleNotificationSync.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement `buildScheduleNotificationCandidates`**

Reuse `scheduleDateForBlock`, action buttons, and sound data from current `syncScheduleNotifications`, without `.slice(0, MAX_PENDING_NOTIFICATIONS)`.

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/schedule/data/notifications/scheduleNotificationSync.ts \
  src/modules/schedule/data/notifications/__tests__/scheduleNotificationSync.test.ts
git commit -m "$(cat <<'EOF'
feat(notifications): build schedule candidates without local budget slice

EOF
)"
```

---

### Task 7: applyMustFireNotificationPlan + resync wiring

**Files:**
- Create: `src/infrastructure/notifications/applyMustFireNotificationPlan.ts`
- Create: `src/infrastructure/notifications/__tests__/applyMustFireNotificationPlan.test.ts`
- Modify: `src/infrastructure/notifications/resyncLocalNotifications.ts`
- Modify: `src/infrastructure/notifications/resyncLocalNotificationsFromStorage.ts`
- Modify: `src/modules/pets/petComposition.ts` (and `petStore` resyncDailyRoutine path)
- Modify compositions as needed to export gather helpers

**Interfaces:**
- Produces:

```typescript
export interface MustFirePlanInput {
  reminders: ReminderScheduleInput[];
  healthRecords: SmartHealthRecord[];
  schedules: Array<{
    schedule: DailySchedule;
    blocks: DailyCareBlock[];
    petSpecies?: PetNotificationSpecies;
  }>;
  petSpeciesByPetId?: ReadonlyMap<string, PetNotificationSpecies>;
  activePetId: string | null;
  service?: NotificationService;
}

export async function applyMustFireNotificationPlan(
  input: MustFirePlanInput,
): Promise<PlanApplyResult>;
```

Implementation: concat reminder + health + schedule candidates → `planAndApply`. On `notification_budget_dropped` when `candidates.length > selected.length`, call `trackEvent('notification_budget_dropped', { ...droppedByKind })`.

**`resyncAllLocalNotifications`:**
1. `ensureNotificationsReady`
2. Load pets, reminders, userId, activePetId from stores
3. **Do not** call `syncDailyRoutineNotifications`
4. Load health records for all pet ids
5. For **each** pet, `buildDailySchedule.execute` for today; collect schedules
6. Map pets → `ReminderScheduleInput` with species (reuse composition helpers)
7. `applyMustFireNotificationPlan(...)`

**`resyncLocalNotificationsFromStorage`:** same without Zustand (local datasources); all pets’ schedules; no routines.

**Pets:** Change `syncDailyRoutineNotifications` call sites used on create/update/resync to **cancel** routine triggers for that pet (export `cancelDailyRoutineNotificationsForPet` if not present) instead of scheduling. Full resync planner already strips `routine-` prefixes.

- [ ] **Step 1: Failing test** — given 1 reminder + 1 health + 1 schedule candidate inputs, apply selects ≤64 and cancels routine pending via mock service

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement apply + rewire resyncs + stop routine schedule**

- [ ] **Step 4: Run**

```bash
yarn test -- src/infrastructure/notifications/__tests__/applyMustFireNotificationPlan.test.ts
yarn test -- src/infrastructure/notifications/__tests__/notificationPlanner.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(notifications): route must-fire resync through central planner

EOF
)"
```

---

### Task 8: Feature sync paths call must-fire plan

**Files:**
- Modify: `src/modules/reminders/remindersComposition.ts`
- Modify: `src/modules/reminders/store/reminderStore.ts` (if it calls sync directly)
- Modify: `src/modules/records/recordsComposition.ts`
- Modify: `src/modules/schedule/scheduleComposition.ts`
- Modify: `src/modules/schedule/store/scheduleStore.ts`

**Behavior:**
- After reminder create/update/delete: cancel that reminder’s ids (delete) then `resyncAllLocalNotifications()` **or** build full must-fire input from stores and `applyMustFireNotificationPlan`. Prefer calling `resyncAllLocalNotifications()` to avoid duplicating gather logic (already deferred-safe).
- After smart health record sync: replace `syncAllSmartHealthDueNotifications` scheduling with cancel-for-unselected + `resyncAllLocalNotifications()` / apply plan.
- After schedule block Done/Snooze: keep `cancelScheduleBlockNotification`; then resync must-fire (all pets) instead of `syncScheduleNotifications` for active only.
- Single-pet schedule store sync: switch to full must-fire resync so other pets stay correct.

Avoid infinite loops: resync must not trigger store loads that re-enter sync. Use existing `deferredNotificationResync` where AppState already does.

- [ ] **Step 1: Update unit tests** that mocked `syncScheduleNotifications` / `syncAllReminderNotifications` to expect planner/resync

- [ ] **Step 2: Run relevant store/composition tests — FAIL then fix**

- [ ] **Step 3: Implement call-site switches**

- [ ] **Step 4: Run**

```bash
yarn test -- src/infrastructure/notifications src/modules/reminders src/modules/schedule/data/notifications src/modules/records
```

Expected: PASS (or only pre-existing failures unrelated)

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(notifications): point feature syncs at must-fire planner apply

EOF
)"
```

---

### Task 9: Deep links + HealthRecords focusRecordId

**Files:**
- Modify: `src/app/navigation/types.ts` — `HealthRecords: { focusRecordId?: string } | undefined`
- Modify: `src/infrastructure/notifications/notificationBootstrap.ts`
- Modify: `src/modules/records/ui/screens/HealthRecordScreen.tsx`
- Modify: `src/modules/notifications/ui/screens/NotificationDetailScreen.tsx` if it navigates to health without focus
- Test: add `src/infrastructure/notifications/__tests__/notificationNavigation.test.ts` for pure helper if you extract `resolveNotificationNavigation(data)`

**Behavior:**
- On PRESS / initial: `trackEvent('notification_tapped', { kind, notification_id, pet_id })`
- `reminderId`: navigate ReminderDetail (screen already shows “Reminder not found.”)
- `kind === 'smartHealth' && recordId`: navigate `HealthTab` → `HealthRecords` with `{ focusRecordId: recordId }`
- `dailySchedule`: existing WellnessHub params
- Extract optional pure `getNotificationNavigationTarget(data)` returning a discriminated union for unit tests

**HealthRecordScreen:**
- `useRoute` for `focusRecordId`
- If set and no matching record in store after load: show a dismissible banner/text: “This health task is no longer available.”
- If matching: optionally scroll/highlight — minimum is banner-free success when found; if list virtualized, `setSelectedCategory` from record type and rely on item presence

- [ ] **Step 1: Failing test for navigation target helper**

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement helper + bootstrap + screen guard**

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(notifications): deep-link guards and health focus on tap

EOF
)"
```

---

### Task 10: Settings analytics + Notifications label

**Files:**
- Modify: `src/modules/settings/ui/screens/SettingsScreen.tsx`

**Behavior:**
- In `toggleNotifications`, when `nextEnabled === false` after update: `trackEvent('notifications_disabled')`
- When enabling successfully after grant: `trackEvent('notifications_enabled')`
- Rename user-visible “Push Notifications” → “Notifications” (master toggle + test alert strings that say Push)

- [ ] **Step 1: If settings screen has tests, extend; else manual checklist in commit body**

- [ ] **Step 2: Implement**

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(settings): track notification toggle and fix notifications label

EOF
)"
```

---

### Task 11: Spec status + verification sweep

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-notification-strategy-design.md` — Status → `Approved — Phase 1 in progress` or `Phase 1 planned`

- [ ] **Step 1: Run**

```bash
yarn test -- src/infrastructure/notifications src/modules/schedule/data/notifications
npx tsc --noEmit
```

Expected: tests PASS; tsc clean for touched files

- [ ] **Step 2: Manual checklist (device)**

1. Two pets with today’s schedule blocks → both can get pending schedule triggers (within 64)
2. Create reminder → pending ids `reminder-*-24h|1h|due` appear (future only)
3. Mark health done → that record’s `health-*` triggers gone
4. After resync, no `routine-*` pending triggers
5. Tap smart health notification for deleted record → Health list + unavailable message
6. Disable notifications → `notifications_disabled` (PostHog/Firebase) and pending cleared

- [ ] **Step 3: Commit doc + any fixes**

```bash
git commit -m "$(cat <<'EOF'
docs: mark notification strategy phase 1 ready for implementation

EOF
)"
```

---

## Self-review (plan vs spec)

| Spec Phase 1 requirement | Task |
| --- | --- |
| Central planner + budget 64 | Tasks 1, 3 |
| Must-fire candidates (reminder, smart health, schedule) | Tasks 4–6 |
| All-pets schedule | Task 7 |
| Stop routine OS scheduling + strip lingering | Tasks 7–8 |
| Digests out of resync + strip | Task 3/7 prefixes |
| Atomic cancel + reconcile | Task 3 apply |
| Deep links + NOT-03 guard | Task 9 |
| Analytics tapped / budget / disable | Tasks 7, 9, 10 |
| Out of scope Phase 2 welcome/opt-in | Not in tasks |

**Type names:** `NotificationCandidate`, `planAndApply`, `applyMustFireNotificationPlan`, `getTriggerNotificationIds` used consistently across tasks.
