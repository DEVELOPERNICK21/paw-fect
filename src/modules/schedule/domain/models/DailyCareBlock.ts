export type CareCategory =
  | 'feeding'
  | 'walk'
  | 'play'
  | 'potty'
  | 'grooming'
  | 'training'
  | 'health_check'
  | 'litter'
  | 'rest'
  | 'medication'
  | 'bedtime';

export type BlockFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'every_n_days';

export type WellnessBlockStatus = 'upcoming' | 'active' | 'done' | 'skipped';

export interface DailyCareBlock {
  id: string;
  petId: string;
  category: CareCategory;
  title: string;
  description: string;
  scheduledTime: string;
  durationMinutes: number;
  frequency: BlockFrequency;
  frequencyDays?: number;
  weekday?: number;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  notificationTitle: string;
  notificationBody: string;
  isCompleted: boolean;
  completedAt: string | null;
  isFreeFeature: boolean;
  order: number;
  /** Populated by wellness enrichment only — not set by DailyScheduleEngine. */
  status?: WellnessBlockStatus;
  isProFeature?: boolean;
  insightTip?: string;
  isMissed?: boolean;
}
