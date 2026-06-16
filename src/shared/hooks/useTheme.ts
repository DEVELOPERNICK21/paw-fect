import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  getColorsForMode,
  type ThemeMode,
  type AppColors,
} from '../theme/colors';
import { fontFamilies } from '../theme/fonts';
import { spacing, space } from '../theme/spacing';
import { textStyles, fontSizes, fontWeights } from '../theme/typography';
import { radius } from '../theme/radius';
import { getShadows } from '../theme/shadows';
import { useSettingsStore } from '../../modules/settings/store/settingsStore';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const selectedThemeMode = useSettingsStore(
    (state) => state.settings?.themeMode ?? 'system',
  );

  const themeMode: ThemeMode =
    selectedThemeMode === 'system'
      ? colorScheme === 'dark'
        ? 'dark'
        : 'light'
      : selectedThemeMode;

  const colors: AppColors = getColorsForMode(themeMode);

  return useMemo(
    () => ({
      themeMode,
      selectedThemeMode,
      isDarkMode: themeMode === 'dark',
      colors,
      fontFamilies,
      spacing,
      space,
      textStyles,
      fontSizes,
      fontWeights,
      radius,
      shadows: getShadows(colors),
    }),
    [themeMode, selectedThemeMode, colors],
  );
};

export type Theme = ReturnType<typeof useTheme>;

