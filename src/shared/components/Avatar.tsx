import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface AvatarProps {
  source: ImageSourcePropType;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 48,
  containerStyle,
}) => {
  const { colors } = useTheme();

  const radius = size / 2;

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.background,
        },
        containerStyle,
      ])}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

// Example:
// <Avatar source={{ uri: pet.photoUrl }} size={56} />

