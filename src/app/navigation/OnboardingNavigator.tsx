import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import OnboardingFunnelScreen from '../../modules/app/ui/onboarding/OnboardingFunnelScreen';
import OnboardingPaywallHost from '../../modules/app/ui/onboarding/OnboardingPaywallHost';
import OnboardingTipsScreen from '../../modules/app/ui/onboarding/tips/OnboardingTipsScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = React.memo(function OnboardingNavigator() {
  const phase = useOnboardingDraftStore(state => state.draft.phase);

  if (phase === 'paywall') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingPaywallHost} />
      </Stack.Navigator>
    );
  }

  if (phase === 'tips') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingTipsScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingFunnelScreen} />
    </Stack.Navigator>
  );
});

export default OnboardingNavigator;
