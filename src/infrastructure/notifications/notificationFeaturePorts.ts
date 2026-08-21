import type { NotificationCandidate } from './notificationCandidate';
import type { SmartHealthRecord } from '../../modules/records/domain/models/SmartHealthRecord';
import type { ReminderScheduleInput } from './reminderSchedule';
import type { PetNotificationSpecies } from './petNotificationSounds';
import type { SmartHealthNotificationCoverage } from './smartHealthNotificationSelection';

export type MustFirePlanPayload = {
  reminders: ReminderScheduleInput[];
  healthRecords: SmartHealthRecord[];
  scheduleCandidates: NotificationCandidate[];
  petSpeciesByPetId?: ReadonlyMap<string, PetNotificationSpecies>;
  activePetId: string | null;
};

export type CareBlockCommandInput = {
  userId: string;
  petId: string;
  date: string;
  blockId: string;
};

export type SnoozeCareBlockInput = CareBlockCommandInput & {
  currentTime: string;
  snoozeMinutes: number;
};

export type NotificationFeaturePorts = {
  areNotificationsEnabled: () => boolean;
  loadMustFirePlanFromSession: () => Promise<MustFirePlanPayload | null>;
  loadMustFirePlanFromStorage: () => Promise<MustFirePlanPayload | null>;
  loadSmartHealthCoverage: () => Promise<SmartHealthNotificationCoverage | null>;
  markCareBlockDone: (input: CareBlockCommandInput) => Promise<void>;
  snoozeCareBlock: (input: SnoozeCareBlockInput) => Promise<void>;
  cancelScheduleBlockNotification: (
    blockId: string,
    petId: string,
  ) => Promise<void>;
  syncGlanceForPetDate: (
    userId: string,
    petId: string,
    date: string,
  ) => Promise<void>;
  invalidateHomeDashboard: () => void;
};

const defaultPorts: NotificationFeaturePorts = {
  areNotificationsEnabled: () => true,
  loadMustFirePlanFromSession: async () => null,
  loadMustFirePlanFromStorage: async () => null,
  loadSmartHealthCoverage: async () => null,
  markCareBlockDone: async () => {},
  snoozeCareBlock: async () => {},
  cancelScheduleBlockNotification: async () => {},
  syncGlanceForPetDate: async () => {},
  invalidateHomeDashboard: () => {},
};

let ports: NotificationFeaturePorts = defaultPorts;

export function registerNotificationFeaturePorts(
  next: NotificationFeaturePorts,
): void {
  ports = next;
}

export function getNotificationFeaturePorts(): NotificationFeaturePorts {
  return ports;
}
