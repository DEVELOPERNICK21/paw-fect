import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import LoginScreen from '../../modules/auth/ui/screens/LoginScreen';
import OtpScreen from '../../modules/auth/ui/screens/OtpScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = React.memo(function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
});

export default AuthNavigator;
