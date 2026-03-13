import { colors } from '../theme/colors';
import { spacing, space } from '../theme/spacing';
import { textStyles, fontSizes, fontWeights } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export const useTheme = () => {
  return {
    colors,
    spacing,
    space,
    textStyles,
    fontSizes,
    fontWeights,
    radius,
    shadows,
  };
};

export type Theme = ReturnType<typeof useTheme>;

