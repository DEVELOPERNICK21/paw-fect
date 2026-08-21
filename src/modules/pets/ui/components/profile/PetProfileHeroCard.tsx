import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/components/AppText';
import { Button } from '../../../../../shared/components/Button';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';
import { icons } from '../../../../../shared/assets/icons';
import type { Pet } from '../../../domain/models/Pet';
import type { Theme } from '../../../../../shared/hooks/useTheme';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { spacing as spacingTokens } from '../../../../../shared/theme/spacing';
import { radius as radiusTokens } from '../../../../../shared/theme/radius';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../../../../shared/theme/colors';
import { resolvePetAvatarSource } from '../../../../../shared/utils/petDisplayPhoto';

export interface PetProfileHeroCardProps {
  pet: Pet;
  photoSource: ImageSourcePropType;
  breedLabel: string;
  ageLine: string;
  locationLine?: string;
  onPressEdit: () => void;
  onPressShare?: () => void;
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
              // Always light on the media pill (dark-mode text.inverse is near-black).
              color: colors.onAccent,
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
  ({ pet, photoSource, breedLabel, ageLine, locationLine, onPressEdit, onPressShare }) => {
    const bundledOnly = useMemo(
      () => resolvePetAvatarSource({ type: pet.type, photo: null }),
      [pet.type],
    );
    const [displaySource, setDisplaySource] =
      useState<ImageSourcePropType>(photoSource);

    useEffect(() => {
      setDisplaySource(photoSource);
    }, [photoSource]);

    const onHeroImageError = useCallback(() => {
      setDisplaySource(bundledOnly);
    }, [bundledOnly]);

    const theme = useTheme();
    const {
      colors,
      radius,
      spacing,
      textStyles,
      fontFamilies,
      shadows: thShadows,
    } = theme;
    const heroHeight = Math.round(spacing['6xl'] * 7.1);

    const glow = useRef(new Animated.Value(0)).current;
    const glowOpacity = glow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
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
        {/*
         * Pressable covers only the media layer so Edit / Share keep reliable
         * hit targets (nested buttons inside a full-card Pressable fail on Android).
         */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={StyleSheet.absoluteFill}
          accessibilityRole="image"
          accessibilityLabel={`${pet.name} profile photo`}
        >
          <View style={styles.heroImage} collapsable={false}>
            <Image
              source={displaySource}
              style={styles.heroImageInner}
              resizeMode="cover"
              fadeDuration={0}
              onError={onHeroImageError}
            />
          </View>
          {/* Soft edge vignette — darkens corners so the photo feels deeper / sharper. */}
          <LinearGradient
            colors={['rgba(0,0,0,0.22)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Specular gloss — thin diagonal sheen for a premium “glass photo” look. */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.28)',
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0)',
            ]}
            locations={[0, 0.18, 0.42, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.85 }}
            style={styles.glossSheen}
            pointerEvents="none"
          />
          {/* Hairline top rim highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            locations={[0, 1]}
            style={styles.topRim}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.28)',
              'rgba(0,0,0,0.62)',
            ]}
            locations={[0, 0.4, 1]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glowOverlay,
              {
                backgroundColor: colors.brandTint20,
                borderColor: colors.accent,
                opacity: glowOpacity,
              },
            ]}
          />
        </Pressable>

        <View
          style={[
            styles.topActions,
            {
              top: spacing.md,
              right: spacing.md,
              gap: spacing.sm,
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={onPressEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit pet"
            style={[
              styles.shareFab,
              thShadows.sm,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MaterialIcon name="edit" size={20} color={colors.primary} />
          </Pressable>
          {onPressShare ? (
            <Pressable
              onPress={onPressShare}
              accessibilityRole="button"
              accessibilityLabel="Share health card"
              style={[
                styles.shareFab,
                thShadows.sm,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <MaterialIcon name="share" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.overlayContent,
            {
              paddingHorizontal: spacing.xl * 1.2,
              paddingVertical: spacing['2xl'],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.top} pointerEvents="none">
            <BreedPill label={breedLabel} theme={theme} />
          </View>

          <View style={styles.bottom} pointerEvents="box-none">
            <AppText
              style={[
                textStyles.display,
                {
                  // Photo overlay: always light. Dark-mode text.inverse is near-black.
                  color: colors.onAccent,
                  fontFamily: fontFamilies.extrabold,
                  textShadowColor: 'rgba(0,0,0,0.45)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 6,
                },
              ]}
              numberOfLines={1}
            >
              {pet.name}
            </AppText>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.onAccent,
                  marginTop: spacing.xs,
                  fontFamily: fontFamilies.medium,
                  opacity: 0.92,
                  textShadowColor: 'rgba(0,0,0,0.4)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
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
  heroImageInner: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    // Tiny overscale hides soft JPEG edges and reads as a sharper crop.
    transform: [{ scale: 1.03 }],
  },
  glossSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  topRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  overlayContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 2,
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
    height: '42%',
  },
  topActions: {
    position: 'absolute',
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareFab: {
    width: spacingTokens['4xl'],
    height: spacingTokens['4xl'],
    borderRadius: radiusTokens.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
