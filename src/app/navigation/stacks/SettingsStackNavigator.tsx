import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { SettingsStackParamList } from '../types';
import SettingsScreen from '../../../modules/settings/ui/screens/SettingsScreen';
import UserProfileScreen from '../../../modules/settings/ui/screens/UserProfileScreen';
import { PaywallScreen } from '../../../modules/subscription/ui/screens/PaywallScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
};

export const SettingsStackNavigator = React.memo(function SettingsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Settings" screenOptions={stackScreenOptions}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
    </Stack.Navigator>
  );
});
