import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface HomeHeroBarProps {
  petName: string;
  petPhoto: ImageSourcePropType;
  unreadBadge: string | null;
  remainingCount: number;
  onPressPetContext: () => void;
  onPressAlerts: () => void;
  onPressProfile: () => void;
  onPressJumpToCare: () => void;
  theme: Theme;
}

export const HomeHeroBar: React.FC<HomeHeroBarProps> = React.memo(
  ({
    petName,
    petPhoto,
    unreadBadge,
    remainingCount,
    onPressPetContext,
    onPressAlerts,
    onPressProfile,
    onPressJumpToCare,
    theme,
  }) => {
    const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
      theme;
    const jumpLabel =
      remainingCount > 0
        ? `${remainingCount} still to do today`
        : `Open ${petName}'s care`;

    return (
      <View
        style={[
          styles.well,
          {
            backgroundColor: colors.brandTint20,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xl,
            borderBottomLeftRadius: radius['3xl'],
            borderBottomRightRadius: radius['3xl'],
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Caring for ${petName}. Switch pet`}
            onPress={onPressPetContext}
            style={[styles.petContext, { gap: spacing.sm }]}
          >
            <Image
              source={petPhoto}
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.petThumb,
                {
                  borderRadius: radius.round,
                  borderColor: colors.surface,
                },
              ]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.petCopy}>
              <AppText
                style={[textStyles.footer, { color: colors.text.secondary }]}
              >
                Caring for
              </AppText>
              <View style={styles.petNameRow}>
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {petName}
                </AppText>
                <MaterialIcon
                  name="expand_more"
                  size={18}
                  color={colors.text.heading}
                />
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              unreadBadge
                ? `Open alerts, ${unreadBadge} unread`
                : 'Open alerts'
            }
            onPress={onPressAlerts}
            style={[
              styles.iconBtn,
              shadows.sm,
              {
                borderRadius: radius.round,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <MaterialIcon
              name="notifications"
              size={22}
              color={colors.text.heading}
            />
            {unreadBadge ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.danger,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <AppText
                  style={[
                    textStyles.footer,
                    {
                      color: colors.onAccent,
                      fontFamily: fontFamilies.bold,
                    },
                  ]}
                >
                  {unreadBadge}
                </AppText>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            onPress={onPressProfile}
            style={[
              styles.iconBtn,
              shadows.sm,
              {
                borderRadius: radius.round,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <MaterialIcon name="person" size={22} color={colors.text.heading} />
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
          <AppText
            accessibilityRole="header"
            style={[textStyles.display, styles.greeting]}
            numberOfLines={1}
          >
            <AppText
              style={[textStyles.display, { color: colors.text.heading }]}
            >
              For{' '}
            </AppText>
            <AppText
              style={[textStyles.display, { color: colors.primaryDark }]}
            >
              {petName}
            </AppText>
          </AppText>
          <AppText
            style={[
              textStyles.title,
              {
                color: colors.primaryDark,
                fontFamily: fontFamilies.extrabold,
              },
            ]}
          >
            Daily care
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={jumpLabel}
          onPress={onPressJumpToCare}
          style={[
            styles.jump,
            shadows.md,
            {
              marginTop: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              minHeight: spacing['5xl'],
              gap: spacing.sm,
            },
          ]}
        >
          <MaterialIcon name="search" size={20} color={colors.text.secondary} />
          <AppText
            style={[textStyles.body, styles.jumpLabel, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            {jumpLabel}
          </AppText>
          <MaterialIcon
            name="arrow_forward"
            size={18}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>
    );
  },
);

HomeHeroBar.displayName = 'HomeHeroBar';

const styles = StyleSheet.create({
  well: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petContext: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  petThumb: {
    width: 44,
    height: 44,
    borderWidth: 2,
    resizeMode: 'cover',
  },
  petCopy: {
    flex: 1,
    minWidth: 0,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    letterSpacing: -0.6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  jump: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jumpLabel: {
    flex: 1,
  },
});
