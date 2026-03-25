import { CommonActions } from '@react-navigation/native';

import { navigationRef } from './navigationRef';

function guardReady(): boolean {
  return navigationRef.isReady();
}

/**
 * Cross-tab and bootstrap flows. Call only when the app tab navigator is mounted.
 */
export const AppNavigation = {
  toHomeRoot(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'HomeTab',
        params: { screen: 'Home' },
      }),
    );
  },

  toPetsProfile(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'PetsTab',
        params: { screen: 'PetProfile' },
      }),
    );
  },

  toPetsAdd(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'PetsTab',
        params: { screen: 'AddPet' },
      }),
    );
  },

  toHealthRecords(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'HealthTab',
        params: { screen: 'HealthRecords' },
      }),
    );
  },

  toAddHealthRecord(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'HealthTab',
        params: { screen: 'AddHealthRecord' },
      }),
    );
  },

  toReminderList(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'RemindersTab',
        params: { screen: 'ReminderList' },
      }),
    );
  },

  toAddReminder(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'RemindersTab',
        params: { screen: 'AddReminder' },
      }),
    );
  },

  toSettings(): void {
    if (!guardReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'SettingsTab',
        params: { screen: 'Settings' },
      }),
    );
  },
} as const;
