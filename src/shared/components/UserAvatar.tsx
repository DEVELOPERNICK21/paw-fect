import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { fontSizes } from '../theme/typography';

type UserAvatarProps = {
  photoUri: string | null;
  initials: string;
  size: number;
  loading?: boolean;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  photoUri,
  initials,
  size,
  loading,
}) => {
  const { colors, fontFamilies } = useTheme();
  const radiusPx = size / 2;

  if (loading) {
    return (
      <View
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: radiusPx,
            backgroundColor: colors.borderSubtle,
          },
        ]}
        accessibilityRole="image"
        accessibilityLabel="Loading profile photo"
      />
    );
  }

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[styles.image, { width: size, height: size, borderRadius: radiusPx }]}
        accessibilityRole="image"
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radiusPx,
          backgroundColor: colors.primaryLight,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Avatar ${initials}`}
    >
      <Text
        style={[
          styles.initials,
          {
            fontFamily: fontFamilies.bold,
            color: colors.text.inverse,
            fontSize: fontSizes.lg,
          },
        ]}
        numberOfLines={1}
      >
        {initials.slice(0, 3)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    textAlign: 'center',
  },
});
