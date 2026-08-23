import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from './types';
import { useOnboardingDraftStore } from '../../modules/app/store/onboardingDraftStore';
import OnboardingActivationScreen from '../../modules/app/ui/onboarding/OnboardingActivationScreen';
import OnboardingPaywallHost from '../../modules/app/ui/onboarding/OnboardingPaywallHost';
import OnboardingPersistScreen from '../../modules/app/ui/onboarding/OnboardingPersistScreen';
import OnboardingWelcomeScreen from '../../modules/app/ui/onboarding/OnboardingWelcomeScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = React.memo(function OnboardingNavigator() {
  const phase = useOnboardingDraftStore(state => state.draft.phase);

  let ScreenComponent: React.ComponentType;
  switch (phase) {
    case 'welcome':
      ScreenComponent = OnboardingWelcomeScreen;
      break;
    case 'activate':
      ScreenComponent = OnboardingActivationScreen;
      break;
    case 'persist':
      ScreenComponent = OnboardingPersistScreen;
      break;
    case 'paywall':
      ScreenComponent = OnboardingPaywallHost;
      break;
    default:
      ScreenComponent = OnboardingWelcomeScreen;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={ScreenComponent} />
    </Stack.Navigator>
  );
});

export default OnboardingNavigator;
