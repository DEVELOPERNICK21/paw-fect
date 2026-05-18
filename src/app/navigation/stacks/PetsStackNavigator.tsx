import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { PetsStackParamList } from '../types';
import PetProfileScreen from '../../../modules/pets/ui/screens/PetProfileScreen';
import PetHealthCardShareScreen from '../../../modules/pets/ui/screens/PetHealthCardShareScreen';
import DayViewScreen from '../../../modules/schedule/ui/screens/DayViewScreen';
import ScheduleSetupScreen from '../../../modules/schedule/ui/screens/ScheduleSetupScreen';
import ScheduleWeekViewScreen from '../../../modules/schedule/ui/screens/ScheduleWeekViewScreen';
import WellnessScoreScreen from '../../../modules/schedule/ui/screens/WellnessScoreScreen';
import PetSwitcherScreen from '../../../modules/pets/ui/screens/PetSwitcherScreen';
import AddPetScreen from '../../../modules/pets/ui/screens/AddPetScreen';
import AddHealthDetailsScreen from '../../../modules/pets/ui/screens/AddHealthDetailsScreen';
import { PaywallScreen } from '../../../modules/subscription/ui/screens/PaywallScreen';

const Stack = createNativeStackNavigator<PetsStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  detachInactiveScreens: true,
};

export const PetsStackNavigator = React.memo(function PetsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="PetProfile" screenOptions={stackScreenOptions}>
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="PetSwitcher" component={PetSwitcherScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="AddHealthDetails" component={AddHealthDetailsScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen
        name="PetHealthCardShare"
        component={PetHealthCardShareScreen}
      />
      <Stack.Screen name="DayView" component={DayViewScreen} />
      <Stack.Screen name="ScheduleSetup" component={ScheduleSetupScreen} />
      <Stack.Screen name="ScheduleWeekView" component={ScheduleWeekViewScreen} />
      <Stack.Screen name="WellnessScore" component={WellnessScoreScreen} />
    </Stack.Navigator>
  );
});
