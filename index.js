/**
 * @format
 */

import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';

notifee.onBackgroundEvent(async () => {
  // Cold-start taps use getInitialNotification; keep handler registered for Android.
});

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
