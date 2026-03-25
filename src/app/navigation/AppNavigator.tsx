import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { PawTabBar } from './components/PawTabBar';
import type { AppTabParamList } from './types';
import { HealthStackNavigator } from './stacks/HealthStackNavigator';
import { HomeStackNavigator } from './stacks/HomeStackNavigator';
import { PetsStackNavigator } from './stacks/PetsStackNavigator';
import { RemindersStackNavigator } from './stacks/RemindersStackNavigator';
import { SettingsStackNavigator } from './stacks/SettingsStackNavigator';

const Tab = createBottomTabNavigator<AppTabParamList>();

function renderPawTabBar(props: BottomTabBarProps) {
  return <PawTabBar {...props} />;
}

/**
 * height: 0 + absolute so BottomTabView does not reserve extra space under scenes.
 * Content insets come from useAppTabBarInset() on scroll areas only (no double gap).
 */
const floatingTabBarStyle = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  height: 0,
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
};

export const AppNavigator = React.memo(function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={renderPawTabBar}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: floatingTabBarStyle,
        sceneStyle: { flex: 1 },
        animation: 'fade',
      }}
      detachInactiveScreens
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="HealthTab" component={HealthStackNavigator} />
      <Tab.Screen
        name="PetsTab"
        component={PetsStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen name="RemindersTab" component={RemindersStackNavigator} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
});

export default AppNavigator;
