# Notification Strategy Design

**Date:** 2026-08-11  
**Status:** Approved — Phase 1 complete  
**Approach:** Central Notification Planner — reliability first for must-fire types, then demote noise  
**Implementation:** Two plans — Phase 1 (planner + must-fire reliability), then Phase 2 (demotion + settings + full analytics)

## Goal

Make notifications a single retention system: few, correct, completable care alerts that earn taps and avoid disable. A **central planner** owns the OS pending budget so pipelines stop competing blindly.

**Product job:** “Never miss critical care” (smart health + reminders + today’s schedule), offline-first, multi-pet aware.

**Product verdict this design answers:** Direction (local care alerts) is right; strategy shape (many uncapped pipelines) is not. This spec corrects the shape.

## Decisions

| Topic | Choice |
| --- | --- |
| Sequence | **C** — Reliability first, then demote noise |
| Must-fire | **B** — All reminders + smart health + today’s care-schedule blocks |
| Success | **C** — Measurable reliability + lower noise |
| Demotion | **D** — Welcome in-app only; routines/digests opt-in |
| Pets / quota | **C** — All pets, global pending cap + priority |
| Architecture | **1** — Central Notification Planner |

## Current baseline (problem)

- Local-only via Notifee (no FCM); Settings still says “Push Notifications.”
- Seven OS kinds compete independently: `reminder`, `dailyRoutine`, `dailySchedule`, `wellnessDigest`, `smartHealth`, `loginWelcome`, `notificationTest`.
- Schedule sync is **active pet only**; digests are hub-hydrate only and missing from global resync.
- No app-wide pending budget (iOS hard limit 64); schedule caps 64 blocks and health caps 48 records separately — combined volume can exceed OS quota.
- Overlap: routines + schedule + digests can ping the same care moment.
- Gaps: deep-link guards incomplete (esp. smart health missing record); `Reminder.repeat` unused by scheduler.

## In scope

- Central planner over local Notifee pending triggers
- Phase 1: reliability for must-fire (reminders, smart health, care schedule — all pets, capped)
- Phase 2: welcome → in-app only; routines/digests → opt-in
- Deep links that land on a completable action (with missing-entity guards)
- Analytics for tap→return and notification disable

## Out of scope

- FCM / remote push
- Streak or marketing OS notifications
- Redesigning notification sound catalog / channels (keep current routing)
- Changing reminder product types — only how they schedule/compete
- Full `Reminder.repeat` scheduling semantics (deferred; phase 1 keeps −24h / −1h / due)

## Success metrics

| Metric | Intent |
| --- | --- |
| `notification_tapped` → session / care complete | Reliability |
| `notifications_disabled` rate | Noise / trust |
| Pending OS count ≤ budget (64) after every resync | Quota health |
| Stale cancel (done/deleted → 0 pending for that id) | Correctness |

---

## Priority model + budget

**Budget:** global pending-trigger cap = **64** (iOS hard limit; same cap on Android for consistent product behavior).

**Consumes budget:** scheduled OS triggers only. Immediate in-app displays do not.

### Priority tiers (highest → lowest)

| Tier | Kind | When it wins a slot |
| --- | --- | --- |
| P0 | `smartHealth` overdue / due today | Same-day critical care |
| P1 | `reminder` due / −1h | User-set care moments landing soon |
| P2 | `dailySchedule` (all pets) | Today’s care blocks |
| P3 | `reminder` −24h / `smartHealth` due−2d | Early leads |
| P4 | `dailyRoutine` (opt-in only) | Default feed/walk/groom repeats |
| P5 | `wellnessDigest` (opt-in only) | Hub digest rollups |

**Tie-break within a tier:** sooner `fireAt` → `activePet.id` from pet store preferred → stable `id` ascending.

### Selection rule

1. Pipelines emit **candidates**.
2. Planner sorts by tier, then tie-break.
3. Take top **64**.
4. Diff vs currently scheduled: cancel dropped ids; schedule new/changed.
5. Self-test: **outside budget**, max 1, cancelled after fire.

### One care moment = one ping

- Under budget pressure, drop P3 before P0–P2 (prefer due/imminent over stacked leads).
- No separate OS welcome.
- Routines/digests never schedule unless settings opt-in.

---

## Architecture

```
Feature pipelines (candidates only)
  remindersComposition.buildReminderCandidates
  recordsComposition.buildSmartHealthCandidates
  scheduleComposition.buildScheduleCandidates (all pets, today)
  petComposition.buildRoutineCandidates          (phase 2, if opt-in)
  scheduleComposition.buildDigestCandidates     (phase 2, if opt-in)
        │
        ▼
NotificationPlanner (infrastructure)
  rank → slice(64) → diff → cancel/schedule via NotificationService
        │
        ▼
NotifeeNotificationService
```

### Responsibilities

| Layer | Does | Does not |
| --- | --- | --- |
| Feature compositions / sync helpers | Build typed **candidates** from domain data; cancel domain-owned ids on delete/complete before rebuild | Call Notifee schedule directly for competing kinds |
| `NotificationPlanner` | Apply priority + budget; atomic reconcile; `planAndApply(candidates)` | Know reminder/health business rules |
| `resyncAllLocalNotifications` | Gather candidates from all pipelines → one planner apply | Schedule each pipeline independently |
| Navigation / feed | Deep-link by `data.kind`; missing-entity guards; analytics | Decide what gets scheduled |

### Candidate shape

```ts
{
  id: string; // stable OS notification id
  kind: 'reminder' | 'smartHealth' | 'dailySchedule' | 'dailyRoutine' | 'wellnessDigest';
  petId: string | null;
  fireAt: Date;
  priority: 0 | 1 | 2 | 3 | 4 | 5;
  payload: NotificationPayload; // title/body/data/actions/repeat
}
```

### Reconcile contract

On every apply / launch resync:

1. Build full candidate set (respect settings + opt-ins).
2. Planner selects ≤64.
3. Cancel any pending OS id for managed kinds that is not selected (or whose entity is gone/completed).
4. Schedule selected that are missing or changed.
5. Leave unmanaged ids alone (e.g. self-test while armed).

---

## Phase 1 — Reliability + deep links

Must-fire only through planner: reminders, smart health, daily schedule (**all pets**).

**Phase 1 budget protection:** stop automatic `dailyRoutine` OS scheduling (do not emit routine candidates). Digests stay out of global resync. Phase 2 reintroduces routines/digests **only** behind opt-in toggles — so phase 1 is intentionally quieter, not feature-flagged dual-path.

### Reliability rules

| Rule | Behavior |
| --- | --- |
| Atomic cancel→schedule | Entity change: cancel that entity’s pending ids, then rebuild candidates → planner apply |
| Done / delete | Zero pending OS ids for that reminderId / recordId / blockId |
| Launch reconcile | Planner rebuild from storage; drop orphans (missing, completed, past non-repeat) |
| All-pets schedule | Today’s care-block candidates for every pet |
| Quota | Planner enforces ≤64; drop lowest tier first |

### Deep links

| Kind | Destination | Guard |
| --- | --- | --- |
| `reminder` | Reminder detail | Missing → inbox + “no longer available” |
| `smartHealth` | `HealthTab` → `HealthRecords` with `recordId` focus/highlight param (no new screen required) | Missing/completed → list + graceful empty/message (NOT-03) |
| `dailySchedule` | Wellness Hub with `petId` + `blockId` | Missing block/pet → hub for that pet if possible, else Home care |

Emit `notification_tapped` with `{ kind, id, petId }` on PRESS and initial notification. Phase 1 also emits `notification_budget_dropped` when candidates exceed 64, and `notifications_disabled` / `notifications_enabled` on master toggle.

### Error handling

- Planner/schedule failures: log via existing unexpected-error helpers; do not crash resync; next resume/boot retries.
- Permission denied / master notifications off: cancel managed pending ids (or skip schedule); no candidate apply.
- Exact alarm denied (Android): keep current inexact fallback inside `NotificationService`; planner still applies the same candidate set.

### Feed

- Keep delivered → inbox for must-fire when observed.
- Background delivery mirroring is best-effort; do not block phase 1 on perfect killed-state feed sync.

---

## Phase 2 — Demotion + settings + analytics

### Settings (additive)

Keep master `notificationsEnabled`. Add:

| Flag | Default | Effect |
| --- | --- | --- |
| `routineNotificationsEnabled` | `false` | Emit `dailyRoutine` candidates (P4) |
| `digestNotificationsEnabled` | `false` | Emit `wellnessDigest` candidates (P5); include digests in planner resync when on |

Settings copy: “Push Notifications” → **“Notifications”**. Sub-toggles for routines/digests under master (disabled when master off).

### Demotion

| Type | Phase 2 |
| --- | --- |
| `loginWelcome` | No OS notification — in-app only; cancel pending `session-welcome` |
| `dailyRoutine` | OS only if `routineNotificationsEnabled` |
| `wellnessDigest` | OS only if `digestNotificationsEnabled` |
| Self-test | Unchanged; max 1 outside budget |

On toggle off: cancel that kind’s pending ids, then planner re-apply must-fire.

### Analytics events

| Event | When |
| --- | --- |
| `notification_scheduled` | Planner applied (counts by kind) |
| `notification_tapped` | PRESS / initial open `{ kind, notification_id, pet_id }` |
| `notification_action` | Done / Snooze `{ kind, action }` |
| `notification_care_completed` | Care completed in attribution window after tap/action (~30 min) |
| `notifications_disabled` | Master toggle → false |
| `notifications_enabled` | Master toggle → true |
| `notification_opt_in_changed` | Routine/digest toggles `{ type, enabled }` |
| `notification_budget_dropped` | Candidates > 64; dropped counts by kind |

### Rollout

1. Ship planner + phase 1 without feature flag if tests cover reconcile (corrective behavior change).
2. Phase 2: routines/digests default **off** for existing users (noise drop; re-enable in Settings).
3. Welcome OS removal ships with phase 2.

---

## Testing (acceptance)

### Phase 1

- Candidate builders unit-tested per pipeline
- Planner: sort, cap 64, deterministic tie-break, diff cancel/schedule
- Done/delete → 0 pending for that entity
- Resync with multiple pets schedules care blocks for each (within budget)
- Over-quota: P0–P2 retained over P3
- Deep-link guards for missing reminder / health record / schedule block
- `resyncAllLocalNotifications` / boot path call planner once (no per-pipeline direct schedule for managed kinds)

### Phase 2

- Defaults: routine/digest opt-in false → no those OS ids after resync
- Toggles cancel/reschedule correctly
- Welcome does not call OS display
- Analytics events fire on tap, disable, budget drop

## References

- `docs/product-validation-pack.md` — habit + notification tap→return metrics
- `docs/health-records-agent-robustness-prompt.md` — NOT-01…04, RULE-NOT-*, iOS 64
- `src/infrastructure/notifications/resyncLocalNotifications.ts` — current independent pipelines
- `src/infrastructure/notifications/notificationBootstrap.ts` — navigation today
