export type NotificationNavigationTarget =
  | { target: 'reminderDetail'; reminderId: string }
  | { target: 'healthRecords'; focusRecordId: string; petId?: string }
  | { target: 'wellnessHub'; petId: string; blockId?: string }
  | { target: 'petProfile' }
  | { target: 'home' };

export function getNotificationNavigationTarget(
  data: Record<string, string> | undefined | null,
): NotificationNavigationTarget | null {
  if (data == null) {
    return null;
  }
  if (data.reminderId) {
    return { target: 'reminderDetail', reminderId: data.reminderId };
  }
  if (data.kind === 'smartHealth' && data.recordId) {
    return {
      target: 'healthRecords',
      focusRecordId: data.recordId,
      petId: data.petId,
    };
  }
  if (data.kind === 'dailySchedule' && data.petId) {
    return {
      target: 'wellnessHub',
      petId: data.petId,
      blockId: data.blockId,
    };
  }
  if (data.kind === 'dailyRoutine') {
    return { target: 'petProfile' };
  }
  if (data.kind === 'loginWelcome') {
    return { target: 'home' };
  }
  return null;
}
