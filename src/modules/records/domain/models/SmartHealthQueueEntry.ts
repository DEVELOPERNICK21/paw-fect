import type { SmartHealthRecord } from './SmartHealthRecord';

export type SmartHealthQueueOp = 'markDone' | 'skip' | 'reschedule';

export interface SmartHealthQueueEntry {
  id: string;
  op: SmartHealthQueueOp;
  petId: string;
  recordId: string;
  record: SmartHealthRecord;
  completedDate?: string;
  petDateOfBirth?: string;
  reason?: string;
  newDueDate?: string;
  attempts?: number;
  nextAttemptAt?: number;
  lastError?: string;
  enqueuedAt: string;
}

export type SmartHealthQueueEntryInput = Omit<
  SmartHealthQueueEntry,
  'id' | 'enqueuedAt' | 'attempts' | 'nextAttemptAt'
>;
