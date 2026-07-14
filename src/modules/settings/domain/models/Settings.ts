export type ThemePreference = 'light' | 'dark' | 'system';

export type CareInterest = 'vaccines' | 'walks' | 'meds' | 'grooming';

export interface Settings {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  onboardingCompleted: boolean;
  themeMode: ThemePreference;
  careInterests: CareInterest[];
}
