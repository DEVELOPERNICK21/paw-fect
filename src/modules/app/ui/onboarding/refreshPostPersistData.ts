import { requestNotificationResync } from '../../../../infrastructure/notifications/requestNotificationResync';

export const refreshPostPersistData = async (
  loadPets: () => Promise<void>,
  loadReminders: () => Promise<void>,
): Promise<void> => {
  await Promise.all([loadPets(), loadReminders()]);
  await requestNotificationResync().catch(() => {});
};
