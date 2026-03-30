import type { PetType } from '../../../pets/domain/models/Pet';

export type HealthTaskType = 'deworming' | 'vaccination';

export type VaccinationType =
  | 'rabies'
  | 'dhpp' // Dogs: Distemper, Hepatitis, Parainfluenza, Parvovirus
  | 'fvrcp'; // Cats: Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia

export type DewormingType = 'deworming';

export type HealthTaskStatus = 'pending' | 'completed' | 'overdue' | 'skipped';

export type TaskUrgency = 'overdue' | 'due_soon' | 'upcoming' | 'completed';

export interface HealthSchedule {
  id: string;
  petId: string;
  taskType: HealthTaskType;
  taskName: string;
  vaccineType?: VaccinationType;

  // Timing
  frequencyDays: number;
  nextDueDate: string; // ISO date string
  lastCompletedDate?: string; // ISO date string

  // Status
  status: HealthTaskStatus;
  isEnabled: boolean;

  // For vaccinations (series)
  isPartOfSeries: boolean;
  seriesOrder?: number; // e.g., 1st, 2nd, 3rd dose
  totalSeriesDoses?: number; // Total doses in series
  seriesCompletedCount: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;

  // Sync
  syncStatus: 'pending' | 'synced' | 'failed';
  localUpdatedAt: string;
}

export interface HealthScheduleCompletion {
  id: string;
  scheduleId: string;
  petId: string;
  completedDate: string; // ISO date string
  nextDueDate: string; // Calculated next due
  notes?: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface HealthScheduleTemplate {
  id: string;
  taskType: HealthTaskType;
  taskName: string;
  vaccineType?: VaccinationType;
  defaultFrequencyDays: number;
  applicablePetTypes: PetType[];

  // Age-based rules
  minAgeWeeks?: number; // Minimum age in weeks to start
  maxAgeWeeks?: number; // Maximum age to complete series
  intervalWeeks?: number; // Interval between doses in series

  // Series configuration
  isSeries: boolean;
  totalDoses?: number;

  // Adult pet rules
  adultFrequencyDays?: number;

  // Puppy/kitten rules (for deworming)
  youngPetFrequencyDays?: number;
  switchToAdultAtWeeks?: number;
}

export interface PetHealthProfile {
  petId: string;
  petType: PetType;
  birthDate?: string;

  // Calculated age
  ageInWeeks?: number;
  isYoungPet: boolean; // < 12 weeks old

  // Active schedules
  dewormingSchedule?: HealthSchedule;
  vaccinationSchedules: HealthSchedule[];

  // Completion history
  completionHistory: HealthScheduleCompletion[];

  // Last sync
  lastSyncedAt?: string;
}
