import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { images } from '../../../../../shared/assets/images';

export const OtpBrandBadge: React.FC = () => {
  const { colors, radius, shadows, spacing } = useTheme();

  const tile = spacing['5xl'] + spacing.xl;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        iconTile: {
          width: tile,
          height: tile,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.md,
        },
        appIcon: {
          width: spacing['5xl'] + spacing.sm,
          height: spacing['5xl'] + spacing.sm,
          resizeMode: 'contain',
        },
      }),
    [colors.surface, radius.xl, shadows.md, tile, spacing],
  );

  return (
    <View style={styles.iconTile}>
      <Image source={images.appIcon} style={styles.appIcon} />
    </View>
  );
};

export default OtpBrandBadge;
