/** Notifee pressAction ids for daily schedule care alerts. */
export const CARE_NOTIFICATION_ACTION_DONE = 'care-done' as const;
export const CARE_NOTIFICATION_ACTION_SNOOZE_15 = 'care-snooze-15' as const;
export const CARE_NOTIFICATION_ACTION_SNOOZE_60 = 'care-snooze-60' as const;

export const CARE_NOTIFICATION_ACTION_IDS = [
  CARE_NOTIFICATION_ACTION_DONE,
  CARE_NOTIFICATION_ACTION_SNOOZE_15,
  CARE_NOTIFICATION_ACTION_SNOOZE_60,
] as const;

export type CareNotificationActionId =
  (typeof CARE_NOTIFICATION_ACTION_IDS)[number];

export function isCareNotificationActionId(
  id: string | undefined,
): id is CareNotificationActionId {
  return (
    id != null &&
    (CARE_NOTIFICATION_ACTION_IDS as readonly string[]).includes(id)
  );
}

export function snoozeMinutesForAction(
  actionId: CareNotificationActionId,
): number | null {
  if (actionId === CARE_NOTIFICATION_ACTION_SNOOZE_15) {
    return 15;
  }
  if (actionId === CARE_NOTIFICATION_ACTION_SNOOZE_60) {
    return 60;
  }
  return null;
}

export interface CareNotificationAndroidAction {
  title: string;
  pressAction: { id: string };
}

export function buildCareScheduleNotificationActions(): CareNotificationAndroidAction[] {
  return [
    {
      title: 'Done',
      pressAction: { id: CARE_NOTIFICATION_ACTION_DONE },
    },
    {
      title: 'Snooze 15m',
      pressAction: { id: CARE_NOTIFICATION_ACTION_SNOOZE_15 },
    },
    {
      title: 'Snooze 1h',
      pressAction: { id: CARE_NOTIFICATION_ACTION_SNOOZE_60 },
    },
  ];
}
