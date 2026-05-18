import type { DailyCareBlock } from './DailyCareBlock';

export interface DailySchedule {
  petId: string;
  date: string;
  blocks: DailyCareBlock[];
  completionPercent: number;
  streakDays: number;
  wellnessScore: number;
}
