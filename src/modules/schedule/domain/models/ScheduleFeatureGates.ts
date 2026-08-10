/**
 * Feature IDs that are actually shipped and gated in product.
 * Do not list aspirational PRO items here — paywall/copy must match runtime.
 */
export const SCHEDULE_FEATURE_GATES = {
  FREE: [
    'basic_daily_schedule',
    'feeding_reminders',
    'walk_reminders_dog',
    'play_reminders_cat',
    'litter_reminders_cat',
    'daily_checklist',
    'basic_streak_counter',
    'vaccination_deworming_records',
  ],
  PRO: [
    'weekly_wellness_score',
    'grooming_reminders',
    'health_check_reminders',
    'custom_reminder_times',
    'week_view_calendar',
    'snooze_reminders',
  ],
} as const;

export function isScheduleProUser(plan: string): boolean {
  return plan !== 'free';
}
