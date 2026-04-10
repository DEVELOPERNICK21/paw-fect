import type { SmartHealthRecord } from '../models/SmartHealthRecord';
import { canApplyDewormingUserTransition } from './DewormingScheduleStateMachine';

export function validateDewormingMarkComplete(
  record: SmartHealthRecord,
): { ok: true } | { ok: false; error: string } {
  if (record.type !== 'deworming') {
    return { ok: false, error: 'Not a deworming record.' };
  }
  if (!canApplyDewormingUserTransition(record.status, 'complete')) {
    return {
      ok: false,
      error: 'This dose cannot be marked complete from its current status.',
    };
  }
  return { ok: true };
}

export function validateDewormingSkip(
  record: SmartHealthRecord,
  reason: string,
): { ok: true } | { ok: false; error: string } {
  if (record.type !== 'deworming') {
    return { ok: false, error: 'Not a deworming record.' };
  }
  if (!canApplyDewormingUserTransition(record.status, 'skip')) {
    return {
      ok: false,
      error: 'This dose cannot be skipped from its current status.',
    };
  }
  const trimmed = reason.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: 'Please enter a short reason for skipping.' };
  }
  return { ok: true };
}

export function requireValidDewormingSkip(
  record: SmartHealthRecord,
  reason: string,
): void {
  const v = validateDewormingSkip(record, reason);
  if (!v.ok) {
    throw new Error(v.error);
  }
}

export function requireValidDewormingComplete(record: SmartHealthRecord): void {
  const v = validateDewormingMarkComplete(record);
  if (!v.ok) {
    throw new Error(v.error);
  }
}
