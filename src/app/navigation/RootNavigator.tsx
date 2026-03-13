import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { AppStack } from './AppStack';

export const RootNavigator: React.FC = () => {
  // These flags will eventually come from auth/onboarding state in feature modules.
  const isAuthenticated = false;
  const hasCompletedOnboarding = false;

  let content = <AuthStack />;

  if (isAuthenticated && !hasCompletedOnboarding) {
    content = <OnboardingStack />;
  } else if (isAuthenticated && hasCompletedOnboarding) {
    content = <AppStack />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
};

export default RootNavigator;

