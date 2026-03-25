export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  onboardingCompleted: boolean;
  themeMode: ThemePreference;
}

