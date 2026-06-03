/**
 * @format
 */

import '@react-native-firebase/app';
import notifee, { EventType } from '@notifee/react-native';
import { AppRegistry } from 'react-native';

import { handleCareNotificationAction } from './src/infrastructure/notifications/handleCareNotificationAction';

notifee.onBackgroundEvent(async event => {
  if (event.type !== EventType.ACTION_PRESS) {
    return;
  }
  await handleCareNotificationAction(
    event.detail.pressAction?.id,
    event.detail.notification?.data,
  );
});

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
