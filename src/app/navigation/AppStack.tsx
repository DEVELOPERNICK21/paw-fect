import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AppStackParamList = {
  Home: undefined;
  ReminderList: undefined;
  AddReminder: undefined;
  HealthRecords: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const HomeScreenPlaceholder: React.FC = () => (
  <View>
    <Text>HomeScreen (to be provided by home module)</Text>
  </View>
);

const ReminderListScreenPlaceholder: React.FC = () => (
  <View>
    <Text>ReminderListScreen (to be provided by reminders module)</Text>
  </View>
);

const AddReminderScreenPlaceholder: React.FC = () => (
  <View>
    <Text>AddReminderScreen (to be provided by reminders module)</Text>
  </View>
);

const HealthRecordsScreenPlaceholder: React.FC = () => (
  <View>
    <Text>HealthRecordsScreen (to be provided by records module)</Text>
  </View>
);

const SettingsScreenPlaceholder: React.FC = () => (
  <View>
    <Text>SettingsScreen (to be provided by settings module)</Text>
  </View>
);

export const AppStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreenPlaceholder}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="ReminderList"
        component={ReminderListScreenPlaceholder}
        options={{ title: 'Reminders' }}
      />
      <Stack.Screen
        name="AddReminder"
        component={AddReminderScreenPlaceholder}
        options={{ title: 'Add reminder' }}
      />
      <Stack.Screen
        name="HealthRecords"
        component={HealthRecordsScreenPlaceholder}
        options={{ title: 'Health records' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreenPlaceholder}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;

