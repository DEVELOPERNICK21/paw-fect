import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../../../../shared/components/AppText';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface HomeHealthSummaryCardProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  fallbackPhoto: ImageSourcePropType;
  weightLine: string;
  healthStatusLine: string;
  lastLoggedDateLine: string;
  onPressSeeAll: () => void;
  theme: Theme;
}

export const HomeHealthSummaryCard: React.FC<HomeHealthSummaryCardProps> =
  React.memo(
    ({
      petName,
      petPhoto,
      fallbackPhoto,
      weightLine,
      healthStatusLine,
      lastLoggedDateLine,
      onPressSeeAll,
      theme,
    }) => {
      const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
        theme;
      const [photo, setPhoto] = useState<ImageSourcePropType>(petPhoto);

      useEffect(() => {
        setPhoto(petPhoto);
      }, [petPhoto]);

      const onPhotoError = useCallback(() => {
        setPhoto(fallbackPhoto);
      }, [fallbackPhoto]);

      const cardHeight = spacing['6xl'] * 3 + spacing.xl;

      return (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.head}>
            <AppText
              accessibilityRole="header"
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              Health summary
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open health records"
              onPress={onPressSeeAll}
              hitSlop={8}
              style={styles.seeAll}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, fontFamily: fontFamilies.medium },
                ]}
              >
                See all
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${petName} health. Weight ${weightLine}. Status ${healthStatusLine}. Last visit ${lastLoggedDateLine}.`}
            onPress={onPressSeeAll}
            style={[
              styles.card,
              shadows.md,
              {
                height: cardHeight,
                borderRadius: radius.xl,
                backgroundColor: colors.primaryDark,
              },
            ]}
          >
            <Image
              source={photo}
              accessible={false}
              importantForAccessibility="no"
              onError={onPhotoError}
              resizeMode="cover"
              style={styles.photo}
              accessibilityIgnoresInvertColors
            />
            <LinearGradient
              colors={[colors.primaryDark, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.62, y: 0.55 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', colors.overlay]}
              start={{ x: 0.5, y: 0.35 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View
              style={[
                styles.body,
                {
                  padding: spacing.lg,
                  gap: spacing.md,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.display,
                  styles.petName,
                  { color: colors.onAccent },
                ]}
                numberOfLines={1}
              >
                {petName}
              </AppText>

              <View
                style={[
                  styles.metrics,
                  {
                    backgroundColor: colors.photoGlass,
                    borderRadius: radius.lg,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                <Metric label="Weight" value={weightLine} theme={theme} />
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.borderSubtle },
                  ]}
                />
                <Metric label="Status" value={healthStatusLine} theme={theme} />
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.borderSubtle },
                  ]}
                />
                <Metric
                  label="Last visit"
                  value={lastLoggedDateLine}
                  theme={theme}
                />
              </View>
            </View>
          </Pressable>
        </View>
      );
    },
  );

HomeHealthSummaryCard.displayName = 'HomeHealthSummaryCard';

type MetricProps = {
  label: string;
  value: string;
  theme: Theme;
};

const Metric: React.FC<MetricProps> = ({ label, value, theme }) => {
  const { colors, textStyles, fontFamilies } = theme;
  return (
    <View style={styles.metric}>
      <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
        {label}
      </AppText>
      <AppText
        style={[
          textStyles.subtitle,
          { color: colors.text.heading, fontFamily: fontFamilies.bold },
        ]}
        numberOfLines={1}
      >
        {value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    minHeight: 44,
    justifyContent: 'center',
  },
  card: {
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  petName: {
    letterSpacing: -0.8,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 28,
  },
});
