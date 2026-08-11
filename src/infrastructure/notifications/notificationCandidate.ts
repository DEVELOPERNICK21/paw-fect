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
