import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { MaterialIcon } from './MaterialIcon';
import type { Theme } from '../hooks/useTheme';
import { spacing as spacingTokens } from '../theme/spacing';

export interface HomeHeaderProps {
  title?: string;
  /** When omitted, the leading control is hidden (spacer keeps title centered). */
  onPressMenu?: () => void;
  onPressProfile: () => void;
  theme: Theme;
}

const SIDE = spacingTokens['2xl'] + spacingTokens.md;

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(
  ({ title = 'Pawsoul', onPressMenu, onPressProfile, theme }) => {
    const { colors, radius, space, textStyles, spacing } = theme;

    return (
      <View
        style={[
          styles.wrap,
          {
            borderBottomColor: colors.borderSubtle,
            backgroundColor: colors.tabBarBackground,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <View style={[styles.row, { height: space('2xl') + space('2xl') }]}>
          <View style={[styles.side, { width: SIDE }]}>
            {onPressMenu ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                onPress={onPressMenu}
                style={[
                  styles.iconBtn,
                  {
                    borderRadius: radius.sm,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    width: SIDE,
                    height: SIDE,
                  },
                ]}
              >
                <MaterialIcon name="menu" size={22} color={colors.text.secondary} />
              </Pressable>
            ) : (
              <View style={{ width: SIDE, height: SIDE }} />
            )}
          </View>

          <View style={styles.center}>
            <AppText
              numberOfLines={1}
              style={[
                textStyles.title,
                { color: colors.text.heading, textAlign: 'center' },
              ]}
            >
              {title}
            </AppText>
          </View>

          <View style={[styles.side, styles.sideEnd, { width: SIDE }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Your profile"
              onPress={onPressProfile}
              style={[
                styles.iconBtn,
                {
                  borderRadius: radius.sm,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  width: SIDE,
                  height: SIDE,
                },
              ]}
            >
              <MaterialIcon name="person" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  },
);

HomeHeader.displayName = 'HomeHeader';

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    justifyContent: 'center',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    paddingHorizontal: spacingTokens.sm,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
