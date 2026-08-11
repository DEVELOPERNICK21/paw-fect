import { buildScheduleNotificationCandidates } from '../../modules/schedule/data/notifications/scheduleNotificationSync';
import type { DailyCareBlock } from '../../modules/schedule/domain/models/DailyCareBlock';
import type { DailySchedule } from '../../modules/schedule/domain/models/DailySchedule';
import type { SmartHealthRecord } from '../../modules/records/domain/models/SmartHealthRecord';
import { trackEvent } from '../analytics/analytics';
import { notificationService } from './notificationService';
import { planAndApply, type PlanApplyResult } from './notificationPlanner';
import {
  buildReminderNotificationCandidates,
  type ReminderScheduleInput,
} from './reminderSchedule';
import { buildSmartHealthCandidatesForRecords } from './smartHealthNotificationSchedule';
import type { PetNotificationSpecies } from './petNotificationSounds';
import type { NotificationService } from './notificationService';

export interface MustFirePlanInput {
  reminders: ReminderScheduleInput[];
  healthRecords: SmartHealthRecord[];
  schedules: Array<{
    schedule: DailySchedule;
    blocks: DailyCareBlock[];
    petSpecies?: PetNotificationSpecies;
  }>;
  petSpeciesByPetId?: ReadonlyMap<string, PetNotificationSpecies>;
  activePetId: string | null;
  service?: NotificationService;
  nowMs?: number;
  budget?: number;
}

export async function applyMustFireNotificationPlan(
  input: MustFirePlanInput,
): Promise<PlanApplyResult> {
  const {
    reminders,
    healthRecords,
    schedules,
    petSpeciesByPetId,
    activePetId,
    service = notificationService,
    nowMs = Date.now(),
    budget,
  } = input;

  const reminderCandidates = reminders.flatMap(reminder =>
    buildReminderNotificationCandidates(reminder, nowMs),
  );

  const healthCandidates = buildSmartHealthCandidatesForRecords(
    healthRecords,
    petSpeciesByPetId,
    nowMs,
  );

  const scheduleCandidates = schedules.flatMap(({ schedule, blocks, petSpecies }) =>
    buildScheduleNotificationCandidates(schedule, blocks, petSpecies, nowMs),
  );

  const candidates = [
    ...reminderCandidates,
    ...healthCandidates,
    ...scheduleCandidates,
  ];

  const result = await planAndApply({
    candidates,
    activePetId,
    service,
    budget,
  });

  if (candidates.length > result.selected.length) {
    await trackEvent('notification_budget_dropped', { ...result.droppedByKind });
  }

  return result;
}
