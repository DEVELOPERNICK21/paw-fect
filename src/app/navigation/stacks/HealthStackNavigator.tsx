import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { HealthStackParamList } from '../types';
import HealthRecordsScreen from '../../../modules/records/ui/screens/HealthRecordsScreen';
import AddHealthRecordScreen from '../../../modules/records/ui/screens/AddHealthRecordScreen';

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
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} />
      <Stack.Screen name="AddHealthRecord" component={AddHealthRecordScreen} />
    </Stack.Navigator>
  );
});
