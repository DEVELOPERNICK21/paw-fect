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
    'ai_schedule_personalisation',
    'weather_aware_walk_reminders',
    'family_sharing',
    'multi_pet_dashboard',
    'weekly_wellness_score',
    'shareable_wellness_report',
    'health_photo_log',
    'vet_ready_export_pdf',
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
