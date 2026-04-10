import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';

/** Premium upsell at the bottom of the Health records scroll content. */
export const PremiumUpgradeCard: React.FC = () => {
  const theme = useTheme();
  const {
    colors,
    radius,
    space,
    textStyles,
    fontFamilies,
    shadows,
    isDarkMode,
  } = theme;

  const cardTextColor = isDarkMode ? colors.text.inverse : colors.text.heading;
  const buttonBg = isDarkMode ? colors.text.inverse : colors.text.heading;
  const buttonTextColor = isDarkMode ? colors.text.heading : colors.text.inverse;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.accent,
          borderRadius: radius.lg,
          padding: space('lg'),
        },
        shadows.md,
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            backgroundColor: colors.brandTint12,
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.textCol}>
          <AppText
            style={[
              textStyles.title,
              { color: cardTextColor, fontFamily: fontFamilies.extrabold },
            ]}
          >
            Upgrade to Premium
          </AppText>
          <AppText
            style={[
              textStyles.caption,
              {
                color: cardTextColor,
                fontFamily: fontFamilies.medium,
                marginTop: 6,
              },
            ]}
          >
            Unlock automated reminders, vet consults, and digital health
            certificates.
          </AppText>
        </View>

        <View style={styles.btnCol}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Learn more about Premium"
            style={({ pressed }) => [
              styles.learnBtn,
              {
                backgroundColor: buttonBg,
                opacity: pressed ? 0.92 : 1,
                borderRadius: radius.round,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.subtitle,
                { color: buttonTextColor, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              Learn More
            </AppText>
          </Pressable>
        </View>

        <View style={styles.iconBg} pointerEvents="none">
          <MaterialIcon
            name="cloud_upload"
            size={72}
            color={cardTextColor}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  glow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  btnCol: {
    justifyContent: 'flex-start',
  },
  learnBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBg: {
    position: 'absolute',
    right: -22,
    bottom: -38,
    opacity: 0.13,
  },
});
