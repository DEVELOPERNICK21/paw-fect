import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../../pets/domain/models/Pet';
import { AppText } from '../../../../../shared/components/AppText';
import type { Theme } from '../../../../../shared/hooks/useTheme';
import { resolvePetAvatarSource } from '../../../../../shared/utils/petDisplayPhoto';

export interface HomePetSummaryCardProps {
  pet: Pet;
  nextCareMilestoneLine: string;
  lastActivityLine: string;
  remainingCount: number;
  totalCount: number;
  nextActionLine: string;
  onPressViewProfile: () => void;
  theme: Theme;
}

function remainingDisplay(totalCount: number, remainingCount: number): string {
  if (!Number.isFinite(totalCount) || totalCount <= 0) {
    return '—';
  }
  if (!Number.isFinite(remainingCount)) {
    return '—';
  }
  return String(remainingCount);
}

export const HomePetSummaryCard: React.FC<HomePetSummaryCardProps> = React.memo(
  ({
    pet,
    nextCareMilestoneLine,
    lastActivityLine,
    remainingCount,
    totalCount,
    nextActionLine,
    onPressViewProfile,
    theme,
  }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;
    const avatarSource = resolvePetAvatarSource(pet);
    const remainingValue = remainingDisplay(totalCount, remainingCount);
    const remainingLabel =
      totalCount <= 0
        ? 'No plan'
        : remainingCount === 0
          ? 'Done'
          : 'left today';

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${pet.name}. ${remainingValue} left today. Open profile.`}
        onPress={onPressViewProfile}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.sm,
            borderColor: colors.borderSubtle,
            padding: spacing.md,
            gap: spacing.sm,
          },
        ]}
      >
        <View style={[styles.heroRow, { gap: spacing.sm }]}>
          <Image
            source={avatarSource}
            accessible={false}
            importantForAccessibility="no"
            style={[
              styles.avatar,
              {
                borderRadius: radius.round,
                borderColor: colors.borderSubtle,
              },
            ]}
            accessibilityIgnoresInvertColors
          />
          <View style={styles.identity}>
            <AppText
              style={[
                textStyles.subtitle,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                },
              ]}
              numberOfLines={1}
            >
              {pet.name}
            </AppText>
            <AppText
              style={[textStyles.caption, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {nextActionLine}
            </AppText>
          </View>
          <View
            style={[
              styles.metric,
              {
                backgroundColor: colors.brandTint5,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <AppText
              style={[textStyles.metric, { color: colors.accent }]}
              accessibilityLabel={
                totalCount <= 0
                  ? 'No care plan yet'
                  : `${remainingValue} of ${totalCount} remaining today`
              }
            >
              {remainingValue}
            </AppText>
            <AppText
              style={[
                textStyles.metricCaption,
                styles.metricCaption,
                { color: colors.text.secondary },
              ]}
            >
              {remainingLabel}
            </AppText>
          </View>
        </View>

        <View style={[styles.supportRow, { gap: spacing.sm }]}>
          <View style={styles.supportCell}>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
            >
              Next care
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.heading, fontFamily: fontFamilies.medium },
              ]}
              numberOfLines={1}
            >
              {nextCareMilestoneLine}
            </AppText>
          </View>
          <View
            style={[
              styles.supportDivider,
              { backgroundColor: colors.borderSubtle },
            ]}
          />
          <View style={styles.supportCell}>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
            >
              Last logged
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.heading, fontFamily: fontFamilies.medium },
              ]}
              numberOfLines={1}
            >
              {lastActivityLine}
            </AppText>
          </View>
        </View>
      </Pressable>
    );
  },
);

HomePetSummaryCard.displayName = 'HomePetSummaryCard';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderWidth: 1,
    resizeMode: 'cover',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metric: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 56,
    overflow: 'visible',
  },
  metricCaption: {
    textAlign: 'right',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  supportCell: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  supportDivider: {
    width: 1,
  },
});
