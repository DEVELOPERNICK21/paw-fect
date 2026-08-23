import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import OnboardingActivationScreen from '../../modules/app/ui/onboarding/OnboardingActivationScreen';
import OnboardingFunnelScreen from '../../modules/app/ui/onboarding/OnboardingFunnelScreen';
import OnboardingPaywallHost from '../../modules/app/ui/onboarding/OnboardingPaywallHost';
import OnboardingWelcomeScreen from '../../modules/app/ui/onboarding/OnboardingWelcomeScreen';
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

  if (phase === 'welcome') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingWelcomeScreen} />
      </Stack.Navigator>
    );
  }

  if (phase === 'activate') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingActivationScreen} />
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
