import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type OnboardingStackParamList = {
  AddPet: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const AddPetScreenPlaceholder: React.FC = () => (
  <View>
    <Text>AddPetScreen (to be provided by pets module)</Text>
  </View>
);

export const OnboardingStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AddPet"
        component={AddPetScreenPlaceholder}
        options={{ title: 'Add your first pet' }}
      />
    </Stack.Navigator>
  );
};

export default OnboardingStack;

