import React from 'react';
import {
  StatusBar,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/app/navigation/RootNavigator';
import { useTheme } from './src/shared/hooks/useTheme';

const globalTextProps = (Text as unknown as { defaultProps?: TextProps });
globalTextProps.defaultProps = {
  ...(globalTextProps.defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

const globalTextInputProps = (TextInput as unknown as {
  defaultProps?: TextInputProps;
});
globalTextInputProps.defaultProps = {
  ...(globalTextInputProps.defaultProps ?? {}),
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

function App() {
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
