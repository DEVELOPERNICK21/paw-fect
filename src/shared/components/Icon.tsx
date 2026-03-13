import React from 'react';
import { Text, StyleSheet, type TextStyle, type StyleProp } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface IconProps {
  /**
   * Simple icon name or character.
   * This is a lightweight wrapper and can be replaced with a real icon library later.
   */
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({ name, size, color, style }) => {
  const { colors, fontSizes } = useTheme();

  return (
    <Text
      style={StyleSheet.flatten([
        styles.icon,
        {
          fontSize: size ?? fontSizes.lg,
          color: color ?? colors.text.primary,
        },
        style,
      ])}
    >
      {name}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    includeFontPadding: false,
  },
});

