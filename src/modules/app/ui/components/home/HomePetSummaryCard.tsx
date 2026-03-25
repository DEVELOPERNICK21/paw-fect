import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../../pets/domain/models/Pet';
import { AppText } from '../../../../../shared/components/AppText';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';

const DEFAULT_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTjI_FvulIIoJ18XpSIFocjA8fpzab0a4wQoqoigyYdaaJu9-ejR25ixQ2yFX6DVC1P-mzS0rAiIakDqbxX5LGdE0DWkYnYtpIxTgGc4Jyl0WbK2XEsp-jNAw9IUkBT_scs8_GotU6SyC81FS6h7rWgfhYACVrVI1vQpUS76pgAm3E7Ndcuubyf0UWWRj-UDGGtUNpLJyDXtLY7-SVYO_3-XMutK67MzPnT0o_QnAG8_FiMxX44sexZnAbMMEC-G6Cj-8y0VAgtMSD';

export interface HomePetSummaryCardProps {
  pet: Pet;
  healthStatusLine: string;
  nextMealLine: string;
  onPressViewProfile: () => void;
  theme: Theme;
}

export const HomePetSummaryCard: React.FC<HomePetSummaryCardProps> = React.memo(
  ({ pet, healthStatusLine, nextMealLine, onPressViewProfile, theme }) => {
    const {
      colors,
      radius,
      shadows,
      spacing,
      textStyles,
      fontSizes,
      fontFamilies,
    } = theme;
    const uri = pet.photo?.trim() ? pet.photo : DEFAULT_AVATAR_URI;
    const avatarSize = spacing['3xl'] + spacing['2xl'];

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderColor: colors.brandTint10,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            gap: spacing.lg,
          },
          shadows.md,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${pet.name} profile`}
          onPress={onPressViewProfile}
          style={styles.avatarBlock}
        >
          <View style={{ width: avatarSize, height: avatarSize }}>
            <Image
              source={{ uri }}
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: radius.round,
                  borderWidth: 2,
                  borderColor: colors.borderSubtle,
                },
              ]}
              accessibilityIgnoresInvertColors
            />
            <View
              style={[
                styles.activeDot,
                {
                  backgroundColor: colors.success,
                  borderColor: colors.surface,
                  width: spacing.md + spacing.xs,
                  height: spacing.md + spacing.xs,
                  borderRadius: radius.round,
                  right: spacing.xs,
                  bottom: spacing.xs,
                  borderWidth: 2,
                },
              ]}
            />
          </View>
        </Pressable>

        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <AppText
            style={[
              textStyles.overline,
              {
                color: colors.accent,
                letterSpacing: 1.2,
              },
            ]}
          >
            Current status
          </AppText>
          <AppText
            style={[
              textStyles.primaryCta,
              {
                color: colors.text.heading,
                fontSize: fontSizes.xl,
                lineHeight: lineHeights.lg,
                textAlign: 'center',
              },
            ]}
          >
            {pet.name} is doing great today!
          </AppText>
        </View>

        <View style={[styles.statsRow, { gap: spacing.md }]}>
          <View
            style={[
              styles.statTile,
              {
                flex: 1,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.borderSubtle,
                padding: spacing.md,
                gap: spacing.xs,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.footer,
                { color: colors.text.secondary, fontFamily: fontFamilies.bold },
              ]}
            >
              Health
            </AppText>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              {healthStatusLine}
            </AppText>
          </View>
          <View
            style={[
              styles.statTile,
              {
                flex: 1,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.borderSubtle,
                padding: spacing.md,
                gap: spacing.xs,
              },
            ]}
          >
            <AppText
              style={[
                textStyles.footer,
                { color: colors.text.secondary, fontFamily: fontFamilies.bold },
              ]}
            >
              Next meal
            </AppText>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
              numberOfLines={1}
            >
              {nextMealLine}
            </AppText>
          </View>
        </View>

        <Pressable onPress={onPressViewProfile} accessibilityRole="link">
          <AppText
            style={[
              textStyles.caption,
              {
                color: colors.primary,
                fontFamily: fontFamilies.semibold,
                textAlign: 'center',
              },
            ]}
          >
            View full profile
          </AppText>
        </Pressable>
      </View>
    );
  },
);

HomePetSummaryCard.displayName = 'HomePetSummaryCard';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarBlock: {
    alignItems: 'center',
  },
  avatar: {
    resizeMode: 'cover',
  },
  activeDot: {
    position: 'absolute',
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  statTile: {
    borderWidth: 1,
  },
});
