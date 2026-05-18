import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import type { NotificationsStackParamList } from '../types';
import AddReminderScreen from '../../../modules/reminders/ui/screens/AddReminderScreen';
import ReminderDetailScreen from '../../../modules/reminders/ui/screens/ReminderDetailScreen';
import ReminderListScreen from '../../../modules/reminders/ui/screens/ReminderListScreen';
import { NotificationDetailScreen } from '../../../modules/notifications/ui/screens/NotificationDetailScreen';
import { NotificationInboxScreen } from '../../../modules/notifications/ui/screens/NotificationInboxScreen';
import { WellnessHubScreen } from '../../../modules/schedule/ui/screens/WellnessHubScreen';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStackNavigator = React.memo(
  function NotificationsStackNavigator() {
    return (
      <Stack.Navigator
        initialRouteName="WellnessHub"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="WellnessHub" component={WellnessHubScreen} />
        <Stack.Screen name="NotificationInbox" component={NotificationInboxScreen} />
        <Stack.Screen
          name="NotificationDetail"
          component={NotificationDetailScreen}
        />
        <Stack.Screen name="ReminderList" component={ReminderListScreen} />
        <Stack.Screen name="AddReminder" component={AddReminderScreen} />
        <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
      </Stack.Navigator>
    );
  },
);
