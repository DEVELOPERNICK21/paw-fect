import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  textStyle,
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={StyleSheet.flatten([
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingHorizontal: space('md'),
          paddingVertical: space('xs'),
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ])}
    >
      <Text
        style={StyleSheet.flatten([
          textStyles.caption,
          {
            color: selected ? colors.primaryDark : colors.text.secondary,
          },
          textStyle,
        ])}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});

// Example:
// <Chip label="Vaccination" selected={type === 'vaccination'} onPress={() => setType('vaccination')} />

