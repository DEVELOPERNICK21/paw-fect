import { notificationService } from '../../infrastructure/notifications/notificationService';
import { requestNotificationResync } from '../../infrastructure/notifications/requestNotificationResync';
import { syncDeviceGlanceSurfaces } from '../../infrastructure/widgets/syncDeviceGlanceSurfaces';
import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { cancelScheduleBlockNotification } from './data/notifications/scheduleNotificationSync';
import { createPetRepository } from '../pets/data/repositories/PetRepositoryImpl';
import { createScheduleRepository } from './data/repositories/ScheduleRepositoryImpl';
import { BuildDailySchedule } from './domain/usecases/BuildDailySchedule';
import { GetSchedulePreferences } from './domain/usecases/GetSchedulePreferences';
import { MarkCareBlockDone } from './domain/usecases/MarkCareBlockDone';
import { SaveSchedulePreferences } from './domain/usecases/SaveSchedulePreferences';
import { SnoozeCareBlock } from './domain/usecases/SnoozeCareBlock';
import type { DailyCareBlock } from './domain/models/DailyCareBlock';
import type { DailySchedule } from './domain/models/DailySchedule';
import type { PetSchedulePreferences } from './domain/models/PetProfile';
import type {
  PersistedWellnessTaskStatus,
  WellnessStreakRecord,
} from './domain/models/WellnessTask';
import type { ScheduleCompletionRecord } from './domain/repositories/ScheduleRepository';

const scheduleRepository = createScheduleRepository();
const petRepository = createPetRepository();

export const scheduleComposition = {
  buildDailySchedule: new BuildDailySchedule(petRepository, scheduleRepository),
  getSchedulePreferences: new GetSchedulePreferences(scheduleRepository),
  saveSchedulePreferences: new SaveSchedulePreferences(scheduleRepository),
  markCareBlockDone: new MarkCareBlockDone(scheduleRepository),
  snoozeCareBlock: new SnoozeCareBlock(scheduleRepository),
  getDailyCompletionPercents: (
    userId: string,
    petId: string,
    dates: string[],
  ): Promise<Record<string, number | null>> =>
    scheduleRepository.getDailyCompletionPercents(userId, petId, dates),
  getBlockStates: (
    userId: string,
    petId: string,
    date: string,
  ): Promise<Record<string, ScheduleCompletionRecord>> =>
    scheduleRepository.getBlockStates(userId, petId, date),
  getWellnessTasks: (petId: string, date: string, today: string) =>
    scheduleRepository.getWellnessTasks(petId, date, today),
  saveWellnessTask: (
    petId: string,
    date: string,
    blockId: string,
    status: PersistedWellnessTaskStatus,
    today: string,
  ) => scheduleRepository.saveWellnessTask(petId, date, blockId, status, today),
  seedWellnessTasksFromBlockStates: (
    petId: string,
    date: string,
    blockStates: Record<string, ScheduleCompletionRecord>,
    today: string,
  ) =>
    scheduleRepository.seedWellnessTasksFromBlockStates(
      petId,
      date,
      blockStates,
      today,
    ),
  getWellnessStreak: (petId: string) =>
    scheduleRepository.getWellnessStreak(petId),
  saveWellnessStreak: (petId: string, record: WellnessStreakRecord) =>
    scheduleRepository.saveWellnessStreak(petId, record),
  getRelaxedMode: (userId: string) => scheduleRepository.getRelaxedMode(userId),
  setRelaxedMode: (userId: string, enabled: boolean) =>
    scheduleRepository.setRelaxedMode(userId, enabled),
  resyncMustFireNotifications: async (): Promise<void> => {
    await requestNotificationResync();
  },
  cancelScheduleBlockNotification: async (blockId: string, petId: string): Promise<void> => {
    await cancelScheduleBlockNotification(blockId, petId, notificationService);
  },
  syncGlanceForSchedule: async (schedule: DailySchedule): Promise<void> => {
    const userId = getAppSessionUserId();
    if (userId == null) {
      return;
    }
    const pet = await petRepository.getPetById(userId, schedule.petId);
    if (pet != null) {
      syncDeviceGlanceSurfaces({ pet, schedule });
    }
  },
} as const;

export type { DailySchedule, DailyCareBlock, PetSchedulePreferences };
