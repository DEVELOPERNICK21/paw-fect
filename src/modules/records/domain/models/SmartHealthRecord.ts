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
