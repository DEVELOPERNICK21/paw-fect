import {
  areAppSessionNotificationsEnabled,
  getAppSessionUserId,
} from '../../../shared/session/appSessionPorts';
import { getTodayIsoDateLocal } from '../../../shared/utils/calendarDate';
import { storageService } from '../../../infrastructure/storage/storageService';
import {
  registerNotificationFeaturePorts,
  type MustFirePlanPayload,
} from '../../../infrastructure/notifications/notificationFeaturePorts';
import { computeSmartHealthNotificationCoverage } from '../../../infrastructure/notifications/smartHealthNotificationSelection';
import type { ReminderScheduleInput } from '../../../infrastructure/notifications/reminderSchedule';
import type { PetNotificationSpecies } from '../../../infrastructure/notifications/petNotificationSounds';
import type { SmartHealthRecord } from '../../records/domain/models/SmartHealthRecord';
import type { Reminder } from '../../reminders/domain/models/Reminder';
import { createPetLocalDataSource } from '../../pets/data/datasources/PetLocalDataSource';
import { createReminderLocalDataSource } from '../../reminders/data/datasources/ReminderLocalDataSource';
import { createSmartHealthLocalDataSource } from '../../records/data/datasources/SmartHealthLocalDataSource';
import { usePetStore } from '../../pets/store/petStore';
import { useReminderStore } from '../../reminders/store/reminderStore';
import { recordsComposition } from '../../records/recordsComposition';
import { scheduleComposition } from '../../schedule/scheduleComposition';
import { normalizeStoredUser } from '../../auth/domain/models/normalizeStoredUser';
import { buildScheduleNotificationCandidates } from '../../schedule/data/notifications/scheduleNotificationSync';

const AUTH_USER_KEY = 'authUser';

function toReminderScheduleInputs(
  reminders: Reminder[],
  petSpeciesByPetId: ReadonlyMap<string, PetNotificationSpecies>,
): ReminderScheduleInput[] {
  return reminders.map(reminder => ({
    id: reminder.id,
    petId: reminder.petId,
    title: reminder.title,
    date: reminder.date,
    time: reminder.time,
    petSpecies: petSpeciesByPetId.get(reminder.petId),
  }));
}

async function buildScheduleCandidatesForPets(
  userId: string,
  pets: Array<{ id: string; type: PetNotificationSpecies }>,
  today: string,
  nowMs: number,
): Promise<MustFirePlanPayload['scheduleCandidates']> {
  const scheduleEntries = await Promise.all(
    pets.map(async pet => {
      const schedule = await scheduleComposition.buildDailySchedule.execute({
        userId,
        petId: pet.id,
        date: today,
      });
      if (schedule == null) {
        return [];
      }
      return buildScheduleNotificationCandidates(
        schedule,
        schedule.blocks,
        pet.type,
        nowMs,
      );
    }),
  );
  return scheduleEntries.flat();
}

async function loadMustFirePlanFromSession(): Promise<MustFirePlanPayload | null> {
  const userId = getAppSessionUserId();
  if (userId == null) {
    return null;
  }

  const pets = usePetStore.getState().pets;
  const reminders = useReminderStore.getState().reminders;
  const activePetId = usePetStore.getState().activePet?.id ?? pets[0]?.id ?? null;
  const petSpeciesByPetId = new Map(
    pets.map(pet => [pet.id, pet.type] as const),
  );
  const today = getTodayIsoDateLocal();
  const nowMs = Date.now();

  const healthRecords = (
    await Promise.all(
      pets.map(pet =>
        recordsComposition.getSmartHealthRecords.execute(userId, pet.id),
      ),
    )
  ).flat();

  const scheduleCandidates = await buildScheduleCandidatesForPets(
    userId,
    pets,
    today,
    nowMs,
  );

  return {
    reminders: toReminderScheduleInputs(reminders, petSpeciesByPetId),
    healthRecords,
    scheduleCandidates,
    petSpeciesByPetId,
    activePetId,
  };
}

async function loadMustFirePlanFromStorage(): Promise<MustFirePlanPayload | null> {
  const raw = await storageService.getItem<unknown>(AUTH_USER_KEY);
  const user = normalizeStoredUser(raw);
  const userId = user?.id ?? null;
  if (userId == null) {
    return null;
  }

  const petLocal = createPetLocalDataSource();
  const reminderLocal = createReminderLocalDataSource();
  const smartHealthLocal = createSmartHealthLocalDataSource();
  const pets = await petLocal.getPets(userId);
  const reminders = await reminderLocal.getReminders();
  const activePetId =
    (await petLocal.getActivePetId(userId)) ?? pets[0]?.id ?? null;
  const petSpeciesByPetId = new Map(
    pets.map(pet => [pet.id, pet.type] as const),
  );
  const today = getTodayIsoDateLocal();
  const nowMs = Date.now();

  const healthRecords = (
    await Promise.all(
      pets.map(pet => smartHealthLocal.getRecords(userId, pet.id)),
    )
  ).flat() as SmartHealthRecord[];

  const scheduleCandidates = await buildScheduleCandidatesForPets(
    userId,
    pets,
    today,
    nowMs,
  );

  return {
    reminders: toReminderScheduleInputs(reminders, petSpeciesByPetId),
    healthRecords,
    scheduleCandidates,
    petSpeciesByPetId,
    activePetId,
  };
}

/** Call from app composition after the orchestrator exists. */
export function wireNotificationFeaturePorts(deps: {
  invalidateHomeDashboard: () => void;
}): void {
  registerNotificationFeaturePorts({
    areNotificationsEnabled: () => areAppSessionNotificationsEnabled(),
    loadMustFirePlanFromSession,
    loadMustFirePlanFromStorage,
    loadSmartHealthCoverage: async () => {
      const userId = getAppSessionUserId();
      const pets = usePetStore.getState().pets;
      if (userId == null || pets.length === 0) {
        return null;
      }
      const records = (
        await Promise.all(
          pets.map(pet =>
            recordsComposition.getSmartHealthRecords.execute(userId, pet.id),
          ),
        )
      ).flat();
      return computeSmartHealthNotificationCoverage(records);
    },
    markCareBlockDone: async input => {
      await scheduleComposition.markCareBlockDone.execute({
        ...input,
        completed: true,
      });
    },
    snoozeCareBlock: async input => {
      await scheduleComposition.snoozeCareBlock.execute(input);
    },
    cancelScheduleBlockNotification: async (blockId, petId) => {
      await scheduleComposition.cancelScheduleBlockNotification(blockId, petId);
    },
    syncGlanceForPetDate: async (userId, petId, date) => {
      const schedule = await scheduleComposition.buildDailySchedule.execute({
        userId,
        petId,
        date,
      });
      if (schedule != null) {
        await scheduleComposition.syncGlanceForSchedule(schedule);
      }
    },
    invalidateHomeDashboard: deps.invalidateHomeDashboard,
  });
}
