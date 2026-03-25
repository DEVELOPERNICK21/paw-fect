import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RemindersStackParamList } from '../types';
import ReminderListScreen from '../../../modules/reminders/ui/screens/ReminderListScreen';
import AddReminderScreen from '../../../modules/reminders/ui/screens/AddReminderScreen';
import ReminderDetailScreen from '../../../modules/reminders/ui/screens/ReminderDetailScreen';

const Stack = createNativeStackNavigator<RemindersStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  detachInactiveScreens: true,
};

export const RemindersStackNavigator = React.memo(
  function RemindersStackNavigator() {
    return (
      <Stack.Navigator
        initialRouteName="ReminderList"
        screenOptions={stackScreenOptions}
      >
        <Stack.Screen name="ReminderList" component={ReminderListScreen} />
        <Stack.Screen name="AddReminder" component={AddReminderScreen} />
        <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
      </Stack.Navigator>
    );
  },
);
