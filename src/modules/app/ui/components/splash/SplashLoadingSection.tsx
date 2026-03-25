import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { radius } from '../../../../../shared/theme/radius';
import { spacing } from '../../../../../shared/theme/spacing';
import { textStyles } from '../../../../../shared/theme/typography';
import { SPLASH_PROGRESS_TRACK_HEIGHT } from '../../constants/splashLayout';

interface SplashLoadingSectionProps {
  progress: number;
  label: string;
  version: string;
}

export const SplashLoadingSection: React.FC<SplashLoadingSectionProps> = ({
  progress,
  label,
  version,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText
          style={[
            textStyles.splashProgressLabel,
            { flex: 1, marginRight: spacing.md, color: colors.text.body },
          ]}
        >
          {label}
        </AppText>
        <AppText
          style={[
            textStyles.splashProgressValue,
            { color: colors.accent },
          ]}
        >
          {Math.round(progress * 100)}%
        </AppText>
      </View>

      <View
        style={[
          styles.track,
          {
            marginTop: spacing.sm + spacing.xxs,
            height: SPLASH_PROGRESS_TRACK_HEIGHT,
            backgroundColor: colors.brandTint20,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.accent,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.versionWrap}>
        <AppText
          style={[
            textStyles.splashVersion,
            { color: colors.text.subdued },
          ]}
        >
          {version}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  versionWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});

export default SplashLoadingSection;
