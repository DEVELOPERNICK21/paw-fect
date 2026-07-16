import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import OnboardingFunnelScreen from '../../modules/app/ui/onboarding/OnboardingFunnelScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = React.memo(function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingFunnelScreen} />
    </Stack.Navigator>
  );
});

export default OnboardingNavigator;
