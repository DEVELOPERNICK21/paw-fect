export type SmartHealthRecordType = 'vaccination' | 'deworming';

export type SmartHealthRecordStatus = 'upcoming' | 'completed' | 'overdue';

export type SmartHealthRecurrenceType = 'none' | 'yearly' | 'quarterly';

export interface SmartHealthRecord {
  id: string;
  userId: string;
  petId: string;
  type: SmartHealthRecordType;
  name: string;
  dueDate: string; // YYYY-MM-DD
  completedDate: string | null; // YYYY-MM-DD
  status: SmartHealthRecordStatus;
  recurrenceType: SmartHealthRecurrenceType;
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
  lastVaccinationDate?: string;
  lastDewormingDate?: string;
}

