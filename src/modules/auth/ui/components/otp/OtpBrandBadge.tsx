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
          overflow: 'hidden',
          ...shadows.md,
        },
        appIcon: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
      }),
    [colors.surface, radius.xl, shadows.md, tile],
  );

  return (
    <View style={styles.iconTile}>
      <Image source={images.appIcon} style={styles.appIcon} />
    </View>
  );
};

export default OtpBrandBadge;
