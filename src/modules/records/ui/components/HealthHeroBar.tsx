import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../shared/hooks/useTheme';

export interface HealthHeroBarProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  ageLabel: string;
  onPressBack: () => void;
  theme: Theme;
}

/** Flat health header — pet identity once, no category tabs. */
export const HealthHeroBar: React.FC<HealthHeroBarProps> = React.memo(
  ({ petName, petPhoto, ageLabel, onPressBack, theme }) => {
    const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
      theme;

    return (
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSubtle,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onPressBack}
            style={({ pressed }) => [
              styles.iconBtn,
              shadows.sm,
              {
                borderRadius: radius.round,
                backgroundColor: colors.brandTint10,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <MaterialIcon
              name="arrow_back"
              size={20}
              color={colors.text.heading}
            />
          </Pressable>

          <Image
            source={petPhoto}
            accessible={false}
            importantForAccessibility="no"
            style={[
              styles.petThumb,
              {
                borderRadius: radius.round,
                borderColor: colors.brandTint12,
              },
            ]}
            accessibilityIgnoresInvertColors
          />

          <View style={styles.titleBlock}>
            <AppText
              accessibilityRole="header"
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.extrabold,
                },
              ]}
              numberOfLines={1}
            >
              Health
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamilies.medium,
                  marginTop: spacing.xxs,
                },
              ]}
              numberOfLines={1}
            >
              {petName} · {ageLabel}
            </AppText>
          </View>
        </View>
      </View>
    );
  },
);

HealthHeroBar.displayName = 'HealthHeroBar';

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petThumb: {
    width: 44,
    height: 44,
    borderWidth: 2,
    resizeMode: 'cover',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
