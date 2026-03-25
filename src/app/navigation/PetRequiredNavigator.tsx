import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { PetsStackParamList } from './types';
import AddPetScreen from '../../modules/pets/ui/screens/AddPetScreen';

const Stack = createNativeStackNavigator<PetsStackParamList>();

export const PetRequiredNavigator = React.memo(function PetRequiredNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AddPet"
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen name="AddPet" component={AddPetScreen} />
    </Stack.Navigator>
  );
});

export default PetRequiredNavigator;

