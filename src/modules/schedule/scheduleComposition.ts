import { notificationService } from '../../infrastructure/notifications/notificationService';
import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import { syncDeviceGlanceSurfaces } from '../../infrastructure/widgets/syncDeviceGlanceSurfaces';
import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import {
  cancelScheduleBlockNotification,
  syncScheduleNotifications,
} from './data/notifications/scheduleNotificationSync';
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
  syncScheduleNotifications: async (
    schedule: DailySchedule,
    blocks: DailyCareBlock[],
  ): Promise<number> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return 0;
    }
    const userId = getAppSessionUserId();
    let petSpecies: 'dog' | 'cat' | undefined;
    if (userId != null) {
      const pet = await petRepository.getPetById(userId, schedule.petId);
      petSpecies = pet?.type;
    }
    return syncScheduleNotifications(
      schedule,
      blocks,
      notificationService,
      petSpecies,
    );
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
