import type { Pet } from '../../../pets/domain/models/Pet';
import type { Reminder, ReminderType } from '../../../reminders/domain/models/Reminder';

export interface HomeDashboardTodayCareItem {
  reminder: Reminder;
  showCompletedCheck: boolean;
}

/** Merged manual reminders + smart vaccination/deworming in the next 7 days. */
export interface HomeDashboardWeekCareItem {
  id: string;
  title: string;
  subtitle: string;
  kind: 'reminder' | 'vaccination' | 'deworming';
  reminderType?: ReminderType;
}

export interface HomeDashboardAttentionBanner {
  show: boolean;
  headline: string;
  subline: string;
}

/**
 * Read model for the home dashboard. Built from repository snapshots via BuildHomeDashboardViewModel / ObserveHomeDashboard.
 */
export interface HomeDashboardViewModel {
  now: string;
  petsLoading: boolean;
  remindersLoading: boolean;
  hasAnyPet: boolean;
  activePet: Pet | null;
  healthStatusLine: string;
  /** Nearest vaccination or deworming milestone by due date (replaces former “next meal”). */
  nextCareMilestoneLine: string;
  /** Latest health record one-liner for trust (“what we logged last”). */
  lastActivityLine: string;
  weightLine: string;
  activityLine: string;
  heartLine: string;
  attentionBanner: HomeDashboardAttentionBanner;
  todayCare: HomeDashboardTodayCareItem[];
  weekCarePreview: HomeDashboardWeekCareItem[];
  lastError: string | null;
  isRefreshing: boolean;
}
