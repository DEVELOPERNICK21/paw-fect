import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { icons } from '../../../../../shared/assets/icons';
import type { Pet } from '../../../domain/models/Pet';
import type { Theme } from '../../../../../shared/hooks/useTheme';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { spacing as spacingTokens } from '../../../../../shared/theme/spacing';
import { radius as radiusTokens } from '../../../../../shared/theme/radius';
import { useCallback, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../../../shared/theme/colors';

export interface PetProfileHeroCardProps {
  pet: Pet;
  photoUri: string;
  breedLabel: string;
  ageLine: string;
  locationLine?: string;
  onPressEdit: () => void;
}

const BreedPill: React.FC<{ label: string; theme: Theme }> = React.memo(
  ({ label, theme }) => {
    const { colors, radius, spacing, textStyles, fontFamilies } = theme;

    return (
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.brandTint12,
            borderColor: colors.brandTint20,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
        ]}
      >
        <View
          style={[
            styles.pawWrap,
            {
              backgroundColor: colors.brandTint12,
              borderColor: colors.brandTint20,
            },
          ]}
        >
          <icons.paw width={14} height={14} />
        </View>
        <AppText
          style={[
            textStyles.overline,
            {
              color: colors.text.inverse,
              fontFamily: fontFamilies.bold,
              marginLeft: spacing.xs,
            },
          ]}
        >
          {label}
        </AppText>
      </View>
    );
  },
);

BreedPill.displayName = 'BreedPill';

export const PetProfileHeroCard: React.FC<PetProfileHeroCardProps> = React.memo(
  ({ pet, photoUri, breedLabel, ageLine, locationLine, onPressEdit }) => {
    const theme = useTheme();
    const {
      colors,
      radius,
      spacing,
      textStyles,
      fontFamilies,
      shadows: thShadows,
    } = theme;
    const heroHeight = spacing['6xl'] * 7.1;

    const glow = useRef(new Animated.Value(0)).current;
    const glowOpacity = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const photoScale = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.02],
    });

    const handlePressIn = useCallback(() => {
      Animated.timing(glow, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, [glow]);

    const handlePressOut = useCallback(() => {
      Animated.timing(glow, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, [glow]);

    return (
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View
          style={[
            styles.hero,
            thShadows.sm,
            {
              height: heroHeight,
              borderRadius: radius.xl,
              overflow: 'hidden',
              alignSelf: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Animated.Image
            source={{ uri: photoUri }}
            style={[
              styles.heroImage,
              {
                transform: [{ scale: photoScale }],
              },
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)', // top transparent
              'rgba(0,0,0,0.15)',
              'rgba(0,0,0,0.35)',
              'rgba(0,0,0,0.65)', // bottom dark
            ]}
            locations={[0, 0.4, 0.7, 1]}
            style={styles.bottomGradient}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glowOverlay,
              thShadows.lg,
              {
                backgroundColor: colors.brandTint20,
                borderColor: colors.accent,
                opacity: glowOpacity,
                shadowColor: colors.accent,
              },
            ]}
          />

          <View
            style={[
              styles.overlayContent,
              {
                paddingHorizontal: spacing.xl * 1.2,
                paddingVertical: spacing['2xl'],
              },
            ]}
          >
            <View style={styles.top}>
              <BreedPill label={breedLabel} theme={theme} />
            </View>

            <View style={styles.bottom}>
              <AppText
                style={[
                  textStyles.display,
                  {
                    color: colors.text.inverse,
                    fontFamily: fontFamilies.extrabold,
                  },
                ]}
                numberOfLines={1}
              >
                {pet.name}
              </AppText>{' '}
              <AppText
                style={[
                  textStyles.caption,
                  {
                    color: colors.text.inverse,
                    marginTop: spacing.xs,
                    fontFamily: fontFamilies.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {locationLine ? `${ageLine} • ${locationLine}` : ageLine}
              </AppText>
              <Button
                title="Edit Profile"
                onPress={onPressEdit}
                variant="primary"
                style={styles.editBtn}
                textStyle={[
                  textStyles.control,
                  { fontFamily: fontFamilies.bold },
                ]}
                leftAccessory={<icons.editIcon width={18} height={18} />}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

PetProfileHeroCard.displayName = 'PetProfileHeroCard';

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    borderRadius: radiusTokens.xl,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottom: {
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  pawWrap: {
    borderWidth: 1,
    borderRadius: radiusTokens.pill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacingTokens.xs,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: radiusTokens.xl,
  },
  editBtn: {
    alignSelf: 'center',
    height: spacingTokens['5xl'],
    marginTop: spacingTokens.md,
    width: '100%',
    borderRadius: radiusTokens.md,
    // iOS shadow (this is what creates glow-like effect)
    shadowColor: colors.primary, // use your accent color
    shadowOffset: { width: 2, height: 2 }, // critical for glow (not drop shadow)
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 12,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%', // critical — don’t cover full image
  },
});
