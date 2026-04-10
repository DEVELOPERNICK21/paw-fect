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
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.danger + '55',
            backgroundColor: colors.danger + '14',
            padding: spacing.md,
            gap: spacing.xs,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MaterialIcon name="info" size={22} color={colors.danger} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {banner.headline}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                { color: colors.text.secondary, fontFamily: fontFamilies.medium },
              ]}
            >
              {banner.subline}
            </AppText>
          </View>
          <MaterialIcon name="chevron_right" size={22} color={colors.text.subdued} />
        </View>
      </Pressable>
    );
  },
);

HomeAttentionBanner.displayName = 'HomeAttentionBanner';

const styles = StyleSheet.create({
  wrap: {},
});
