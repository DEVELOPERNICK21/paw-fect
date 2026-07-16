import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import OnboardingFunnelScreen from '../../modules/app/ui/onboarding/OnboardingFunnelScreen';
import OnboardingPaywallHost from '../../modules/app/ui/onboarding/OnboardingPaywallHost';

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
    // TODO(Task 7): mount a TipStrip host here instead of falling back to
    // the funnel screen once it exists.
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingFunnelScreen} />
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
