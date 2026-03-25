import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { SettingsStackParamList } from '../types';
import SettingsScreen from '../../../modules/settings/ui/screens/SettingsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  detachInactiveScreens: true,
};

export const SettingsStackNavigator = React.memo(function SettingsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Settings" screenOptions={stackScreenOptions}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
});
