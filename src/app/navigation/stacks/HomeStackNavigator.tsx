import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '../types';
import HomeScreen from '../../../modules/app/ui/screens/HomeScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'default' as const,
  detachInactiveScreens: true,
};

export const HomeStackNavigator = React.memo(function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
});
