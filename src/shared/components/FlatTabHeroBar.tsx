import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { MaterialIcon } from './MaterialIcon';
import type { Theme } from '../hooks/useTheme';

export type FlatTabHeroAction = {
  key: string;
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof MaterialIcon>['name'];
  onPress: () => void;
};

export interface FlatTabHeroBarProps {
  title: string;
  caption?: string;
  theme: Theme;
  onPressBack?: () => void;
  actions?: FlatTabHeroAction[];
}

/**
 * Shared flat tab chrome — matches Health / PetSwitcher title language.
 * Background matches page (`backgroundAlt`) so there is no floating strip
 * (Home keeps its own tint well).
 */
export const FlatTabHeroBar: React.FC<FlatTabHeroBarProps> = React.memo(
  ({ title, caption, theme, onPressBack, actions }) => {
    const { colors, radius, spacing, textStyles, fontFamilies, shadows } =
      theme;

    return (
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.backgroundAlt,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={[styles.topRow, { gap: spacing.sm }]}>
          {onPressBack ? (
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
          ) : null}

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
              {title}
            </AppText>
            {caption ? (
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
                {caption}
              </AppText>
            ) : null}
          </View>

          {actions && actions.length > 0 ? (
            <View style={[styles.actions, { gap: spacing.sm }]}>
              {actions.map(action => (
                <Pressable
                  key={action.key}
                  accessibilityRole="button"
                  accessibilityLabel={action.accessibilityLabel}
                  onPress={action.onPress}
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
                    name={action.icon}
                    size={20}
                    color={colors.text.heading}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  },
);

FlatTabHeroBar.displayName = 'FlatTabHeroBar';

const styles = StyleSheet.create({
  header: {},
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
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
