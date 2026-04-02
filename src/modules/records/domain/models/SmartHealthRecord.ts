export type SmartHealthRecordType = 'vaccination' | 'deworming';

export type SmartHealthRecordStatus =
  | 'upcoming'
  | 'completed'
  | 'overdue'
  | 'locked'
  | 'missed';

export type SmartHealthRecurrenceType = 'none' | 'yearly' | 'quarterly';

export type PetStage = 'puppy' | 'adolescent' | 'adult';

export type RecordPriority = 'critical' | 'high' | 'medium' | 'low';

export type RecordSource = 'system' | 'manual';

/**
 * ============================================================
 * DEWORMING DATA MODEL - NORMALIZED SCHEMA
 * ============================================================
 *
 * Two separate entities to ensure:
 * - Schedule is regeneratable (no permanent future predictions)
 * - Records are source of truth for completed actions
 * - No computed fields stored (status is derived)
 */

// DewormingPhase - the schedule interval type
export type DewormingPhase = 'TWO_WEEK' | 'MONTHLY' | 'QUARTERLY';

/**
 * DewormingSchedule - System generated timeline
 * - Regenerated when pet profile changes (DOB, lifestyle, region)
 * - Does NOT store computed status - computed at read time
 * - Can be deleted and regenerated without data loss
 */
export interface DewormingSchedule {
  id: string; // Unique schedule item ID
  petId: string; // Foreign key to Pet
  dueDate: string; // YYYY-MM-DD - when deworming is due
  phaseType: DewormingPhase; // TWO_WEEK | MONTHLY | QUARTERLY
  sequenceNumber: number; // Order in timeline (1, 2, 3...)
  generatedAt: string; // When this schedule was generated
  sourcePetDob: string; // Pet DOB at generation time (for regeneration)
}

/**
 * DewormingRecord - User completed action (source of truth)
 * - Immutable once created
 * - Links to schedule (nullable - may be manual entry)
 * - actualDate is the source of truth for completion
 */
export interface DewormingRecord {
  id: string; // Unique record ID
  petId: string; // Foreign key to Pet
  scheduleId: string | null; // Optional link to DewormingSchedule
  actualDate: string; // YYYY-MM-DD - When deworming was actually done
  recordedAt: string; // YYYY-MM-DDTHH:mm:ss - When user recorded it
  notes?: string; // Optional user notes
  createdAt: string; // Record creation timestamp
}

/**
 * Compute deworming status from schedule + records
 * NOT stored - computed at read time
 */
export type DewormingStatus = 'pending' | 'completed' | 'overdue' | 'missed';

export interface DewormingStatusResult {
  scheduleId: string;
  status: DewormingStatus;
  completedRecord: DewormingRecord | null;
  daysOverdue: number | null;
}

// ============================================================
// VACCINATION MODEL (unchanged - for reference)
// ============================================================

export interface SmartHealthRecord {
  id: string;
  userId: string;
  petId: string;
  type: SmartHealthRecordType;
  key?: string;
  family?: string;
  category?: 'core' | 'non-core';
  name: string;
  dueDate: string; // YYYY-MM-DD
  recommendedDate?: string; // YYYY-MM-DD
  completedDate: string | null; // YYYY-MM-DD
  status: SmartHealthRecordStatus;
  isOptional?: boolean;
  recurrenceType: SmartHealthRecurrenceType;
  riskLevel?: 'low' | 'medium' | 'high';
  lifestyleTriggers?: string[];
  doseNumber?: number;
  totalDoses?: number;
  // New fields for sequence and context
  stage?: PetStage;
  dependsOn?: string | null; // ID of previous dose that must be completed
  source?: RecordSource;
  isLocked?: boolean; // true if dependsOn not completed
  priority?: RecordPriority;
  contextLabel?: string; // e.g., "Catch-up Required", "Start Vaccination"
  recovery?: {
    isRecovered: boolean;
    recoveredFrom: string | null;
    recoveryReason?: 'missed' | 'late' | 'manual_adjustment';
  };
  createdAt: string;
  updatedAt: string;
}

export interface SmartHealthHistoryLog {
  id: string;
  userId: string;
  petId: string;
  recordId: string;
  action: 'created' | 'completed' | 'rescheduled' | 'generated_next';
  timestamp: string;
  meta?: Record<string, string>;
}

export interface BootstrapSmartScheduleInput {
  userId: string;
  petId: string;
  petType: 'dog' | 'cat';
  dateOfBirth: string; // YYYY-MM-DD
  region?: 'IN' | 'US' | 'EU' | 'OTHER';
  lifestyleType?: 'indoor' | 'outdoor' | 'mixed';
  lifestyleRiskLevel?: 'low' | 'medium' | 'high';
  lastVaccinationDate?: string;
  lastDewormingDate?: string;
}
