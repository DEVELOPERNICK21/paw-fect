/**
 * @format
 */

import '@react-native-firebase/app';
import notifee, { EventType } from '@notifee/react-native';
import { AppRegistry } from 'react-native';

import { startupError, startupLog } from './src/infrastructure/logging/startupLog';
import { handleCareNotificationAction } from './src/infrastructure/notifications/handleCareNotificationAction';

startupLog('index.js loaded');

const errorUtils = global.ErrorUtils;
if (
  errorUtils?.getGlobalHandler != null &&
  errorUtils?.setGlobalHandler != null
) {
  const defaultGlobalHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    startupError(isFatal ? 'fatal_js_error' : 'js_error', error);
    defaultGlobalHandler(error, isFatal);
  });
}

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
