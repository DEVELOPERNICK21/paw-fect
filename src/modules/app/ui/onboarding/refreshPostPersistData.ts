import { requestNotificationResync } from '../../../../infrastructure/notifications/requestNotificationResync';
import { usePetStore } from '../../../pets/store/petStore';
import { useReminderStore } from '../../../reminders/store/reminderStore';

export const refreshPostPersistData = async (
  loadPets: () => Promise<void>,
  loadReminders: () => Promise<void>,
): Promise<void> => {
  await Promise.all([loadPets(), loadReminders()]);
  await requestNotificationResync().catch(() => {});
};

/** Composition helper — keeps onboarding UI off pet/reminder store imports. */
export const refreshPostPersistDataFromStores = (): Promise<void> =>
  refreshPostPersistData(
    () => usePetStore.getState().loadPets(),
    () => useReminderStore.getState().loadReminders(),
  );
