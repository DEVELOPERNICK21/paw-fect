import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Otp: {
    mobile: string;
    displayPhone?: string;
    verificationId: string;
  };
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type HealthStackParamList = {
  HealthRecords: undefined;
  AddHealthRecord: undefined;
};

export type PetsStackParamList = {
  PetProfile: undefined;
  AddPet: { petId?: string } | undefined;
  AddHealthDetails: { kind: 'weight' | 'vaccines' | 'conditions' } | undefined;
};

export type RemindersStackParamList = {
  ReminderList: undefined;
  AddReminder: undefined;
  ReminderDetail: { reminderId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  HealthTab: NavigatorScreenParams<HealthStackParamList> | undefined;
  PetsTab: NavigatorScreenParams<PetsStackParamList> | undefined;
  RemindersTab: NavigatorScreenParams<RemindersStackParamList> | undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

export type HomeRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export type PetProfileRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<PetsStackParamList, 'PetProfile'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export type SettingsRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList, 'Settings'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export type HealthRecordsRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HealthStackParamList, 'HealthRecords'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export type ReminderListRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<RemindersStackParamList, 'ReminderList'>,
  BottomTabNavigationProp<AppTabParamList>
>;

export type ReminderDetailRootNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<RemindersStackParamList, 'ReminderDetail'>,
  BottomTabNavigationProp<AppTabParamList>
>;
