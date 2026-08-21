import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { HomeDashboardAttentionBanner } from '../../../domain/models/HomeDashboardViewModel';
import { AppText } from '../../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export interface HomeAttentionBannerProps {
  banner: HomeDashboardAttentionBanner;
  onPress: () => void;
  theme: Theme;
}

export const HomeAttentionBanner: React.FC<HomeAttentionBannerProps> = React.memo(
  ({ banner, onPress, theme }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    if (!banner.show) {
      return null;
    }

    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint="Opens health records"
        style={[
          styles.wrap,
          {
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.dangerSurface,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            minHeight: 44,
          },
        ]}
      >
        <View style={[styles.row, { gap: spacing.sm }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
          <View style={styles.copy}>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {banner.headline}
            </AppText>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {banner.subline}
            </AppText>
          </View>
          <MaterialIcon name="chevron_right" size={18} color={colors.text.subdued} />
        </View>
      </Pressable>
    );
  },
);

HomeAttentionBanner.displayName = 'HomeAttentionBanner';

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
