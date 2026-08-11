import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { icons } from '../../assets/icons';
import { AppText } from '../AppText';
import { MaterialIcon } from '../MaterialIcon';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

const HERO_SIZE = 128;
const IMAGE_SIZE = 120;

export interface PetPhotoHeroProps {
  photoSource?: ImageSourcePropType;
  placeholder?: React.ReactNode;
  caption?: string;
  onPressCamera?: () => void;
  accessibilityLabel?: string;
}

export const PetPhotoHero: React.FC<PetPhotoHeroProps> = ({
  photoSource,
  placeholder,
  caption,
  onPressCamera,
  accessibilityLabel,
}) => {
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } =
    theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
        },
        heroWrap: {
          width: HERO_SIZE,
          height: HERO_SIZE,
          borderRadius: HERO_SIZE / 2,
          borderWidth: 4,
          borderColor: colors.brandTint20,
          backgroundColor: colors.brandTint5,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        photo: {
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          borderRadius: IMAGE_SIZE / 2,
        },
        defaultIcon: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        cameraBadge: {
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 32,
          height: 32,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.backgroundAlt,
          backgroundColor: colors.accent,
          ...shadows.sm,
        },
        caption: {
          marginTop: spacing.md,
          color: colors.text.body,
          fontFamily: fontFamilies.medium,
          fontStyle: 'italic',
          textAlign: 'center',
        },
      }),
    [
      colors.accent,
      colors.backgroundAlt,
      colors.brandTint20,
      colors.brandTint5,
      colors.text.body,
      fontFamilies.medium,
      radius.round,
      shadows.sm,
      spacing.md,
    ],
  );

  const defaultPlaceholder = (
    <View style={styles.defaultIcon}>
      <icons.paws width={72} height={72} />
    </View>
  );

  const heroContent = photoSource ? (
    <Image
      source={photoSource}
      style={styles.photo}
      resizeMode="cover"
      accessibilityLabel="Pet photo"
    />
  ) : (
    placeholder ?? defaultPlaceholder
  );

  const hero = onPressCamera ? (
    <ScalePressable
      onPress={onPressCamera}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Add pet photo'}
      style={styles.heroWrap}
    >
      {heroContent}
      <View style={styles.cameraBadge}>
        <MaterialIcon
          name="photo_camera"
          size={18}
          color={colors.text.inverse}
        />
      </View>
    </ScalePressable>
  ) : (
    <View style={styles.heroWrap} accessibilityLabel={accessibilityLabel}>
      {heroContent}
    </View>
  );

  return (
    <View style={styles.root}>
      {hero}
      {caption ? (
        <AppText style={[textStyles.marketingLead, styles.caption]}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
};
