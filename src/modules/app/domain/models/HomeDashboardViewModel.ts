import type { Pet } from '../../../pets/domain/models/Pet';
import type { Reminder } from '../../../reminders/domain/models/Reminder';

export interface HomeDashboardTodayCareItem {
  reminder: Reminder;
  showCompletedCheck: boolean;
}

export interface HomeDashboardUpcomingItem {
  reminder: Reminder;
  milestoneSubtitle: string;
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
  nextMealLine: string;
  weightLine: string;
  activityLine: string;
  heartLine: string;
  todayCare: HomeDashboardTodayCareItem[];
  upcoming: HomeDashboardUpcomingItem[];
  lastError: string | null;
  isRefreshing: boolean;
}
