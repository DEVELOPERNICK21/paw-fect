import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const LoginScreenPlaceholder: React.FC = () => (
  <View>
    <Text>LoginScreen (to be provided by auth module)</Text>
  </View>
);

const SignupScreenPlaceholder: React.FC = () => (
  <View>
    <Text>SignupScreen (to be provided by auth module)</Text>
  </View>
);

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreenPlaceholder}
        options={{ title: 'Login' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreenPlaceholder}
        options={{ title: 'Sign up' }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;

