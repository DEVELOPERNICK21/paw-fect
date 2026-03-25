import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import OnboardingScreen from '../../modules/app/ui/screens/OnboardingScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = React.memo(function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
});

export default OnboardingNavigator;
