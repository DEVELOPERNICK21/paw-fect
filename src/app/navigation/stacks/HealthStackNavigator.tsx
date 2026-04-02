import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { HealthStackParamList } from '../types';
import HealthRecordScreen from '../../../modules/records/ui/screens/HealthRecordScreen';
import AddHealthRecordScreen from '../../../modules/records/ui/screens/AddHealthRecordScreen';
import DewormingScreen from '../../../modules/records/ui/screens/DewormingScreen';

const Stack = createNativeStackNavigator<HealthStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  detachInactiveScreens: true,
};

export const HealthStackNavigator = React.memo(function HealthStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="HealthRecords"
      screenOptions={stackScreenOptions}
    >
      <Stack.Screen name="HealthRecords" component={HealthRecordScreen} />
      <Stack.Screen name="AddHealthRecord" component={AddHealthRecordScreen} />
      <Stack.Screen name="Deworming" component={DewormingScreen} />
    </Stack.Navigator>
  );
});
