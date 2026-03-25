import React from 'react';
import {
  Animated,
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { images } from '../../../../../shared/assets/images';
import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { radius } from '../../../../../shared/theme/radius';
import { spacing } from '../../../../../shared/theme/spacing';
import { textStyles } from '../../../../../shared/theme/typography';
import { SPLASH_LOGO } from '../../constants/splashLayout';

interface SplashBrandSectionProps {
  title: string;
  subtitle?: string;
  iconAnimatedStyle?: StyleProp<ViewStyle>;
  iconPulseStyle?: StyleProp<ViewStyle>;
}

export const SplashBrandSection: React.FC<SplashBrandSectionProps> = ({
  title,
  subtitle,
  iconAnimatedStyle,
  iconPulseStyle,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconPulse,
          { backgroundColor: colors.brandTint12 },
          iconPulseStyle,
        ]}
      />
      <Animated.View style={[styles.logoTile, iconAnimatedStyle]}>
        <Image
          source={images.appIcon}
          style={styles.appIcon}
          resizeMode="cover"
        />
      </Animated.View>

      <AppText
        style={[
          textStyles.splashBrandTitle,
          {
            color: colors.text.heading,
            marginTop: spacing.lg + spacing.xs,
          },
        ]}
      >
        {title}
      </AppText>

      {subtitle ? (
        <AppText
          style={[
            textStyles.splashBrandSubtitle,
            { color: colors.accent, marginTop: spacing.sm },
          ]}
        >
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoTile: {
    width: SPLASH_LOGO.size,
    height: SPLASH_LOGO.size,
    borderRadius: radius['3xl'],
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: SPLASH_LOGO.size,
    height: SPLASH_LOGO.size,
    borderRadius: radius['3xl'],
  },
  iconPulse: {
    position: 'absolute',
    top: SPLASH_LOGO.pulseTop,
    width: SPLASH_LOGO.pulseDiameter,
    height: SPLASH_LOGO.pulseDiameter,
    borderRadius: SPLASH_LOGO.pulseBorderRadius,
  },
});

export default SplashBrandSection;
