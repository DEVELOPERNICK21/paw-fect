import React from 'react';
import { StyleSheet, View } from 'react-native';

import { icons } from '../../../../../shared/assets/icons';
import { useTheme } from '../../../../../shared/hooks/useTheme';
import { radius } from '../../../../../shared/theme/radius';
import { spacing } from '../../../../../shared/theme/spacing';
import { SPLASH_VISUAL_CARD } from '../../constants/splashLayout';

export const SplashVisualCard: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing['2xl'] },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.brandTint5,
            borderColor: colors.brandTint10,
            borderRadius: radius.xl,
          },
        ]}
      >
        <View
          style={[
            styles.imageWrap,
            { borderRadius: radius.xl - SPLASH_VISUAL_CARD.innerRadiusInset },
          ]}
        >
          <icons.splashPet width="100%" height="100%" />
          <View
            style={[
              styles.overlay,
              { backgroundColor: colors.splashMediaOverlay },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SPLASH_VISUAL_CARD.height,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    padding: SPLASH_VISUAL_CARD.innerRadiusInset,
    overflow: 'hidden',
  },
  imageWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SplashVisualCard;
