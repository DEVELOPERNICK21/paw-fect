import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { PetsStackParamList } from '../types';
import PetProfileScreen from '../../../modules/pets/ui/screens/PetProfileScreen';
import PetSwitcherScreen from '../../../modules/pets/ui/screens/PetSwitcherScreen';
import AddPetScreen from '../../../modules/pets/ui/screens/AddPetScreen';
import AddHealthDetailsScreen from '../../../modules/pets/ui/screens/AddHealthDetailsScreen';

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
    </Stack.Navigator>
  );
});
