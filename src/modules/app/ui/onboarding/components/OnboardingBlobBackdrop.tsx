import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useTheme } from '../../../../../shared/hooks/useTheme';

type Props = {
  /** Visual density; hero steps use full, form steps use compact. */
  variant?: 'hero' | 'compact';
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  isDarkMode: boolean;
};

const createStyles = ({ isDarkMode }: ThemeParams) =>
  StyleSheet.create({
    wrap: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
      opacity: isDarkMode ? 0.55 : 0.9,
      pointerEvents: 'none',
    },
    compactWrap: {
      height: 160,
      width: '100%',
      overflow: 'hidden',
      opacity: isDarkMode ? 0.4 : 0.7,
      pointerEvents: 'none',
      position: 'absolute',
      top: 0,
      right: 0,
    },
  });

/**
 * Soft organic accent wash + paw marks for onboarding hero steps.
 * Token-colored only (accent / brand tints).
 */
export const OnboardingBlobBackdrop: React.FC<Props> = ({
  variant = 'hero',
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, isDarkMode }),
    [colors, isDarkMode],
  );

  const blob = colors.accent;
  const paw = colors.brandTint20;

  return (
    <View
      style={variant === 'compact' ? styles.compactWrap : styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="xMidYMin slice">
        <Ellipse cx="300" cy="40" rx="200" ry="160" fill={blob} opacity={0.35} />
        <Ellipse cx="250" cy="90" rx="140" ry="110" fill={blob} opacity={0.45} />
        <Ellipse cx="320" cy="120" rx="90" ry="80" fill={blob} opacity={0.3} />
        <Circle cx="210" cy="70" r="10" fill={paw} />
        <Circle cx="232" cy="58" r="7" fill={paw} />
        <Circle cx="248" cy="72" r="7" fill={paw} />
        <Circle cx="228" cy="88" r="7" fill={paw} />
        <Path
          d="M218 95c8 12 28 12 36 0-4 18-32 18-36 0z"
          fill={paw}
        />
        <Circle cx="300" cy="130" r="8" fill={paw} />
        <Circle cx="318" cy="120" r="6" fill={paw} />
        <Circle cx="330" cy="134" r="6" fill={paw} />
        <Circle cx="314" cy="146" r="6" fill={paw} />
        <Path
          d="M306 150c6 10 22 10 28 0-3 14-25 14-28 0z"
          fill={paw}
        />
      </Svg>
    </View>
  );
};
