import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surface
        : colors.danger;

  const borderColor =
    variant === 'secondary' ? colors.primary : 'transparent';

  const textColor =
    variant === 'secondary' ? colors.primary : colors.text.inverse;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={isDisabled ? undefined : onPress}
      style={StyleSheet.flatten([
        styles.button,
        {
          backgroundColor,
          borderRadius: radius.md,
          borderColor,
          paddingVertical: space('sm'),
          paddingHorizontal: space('lg'),
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ])}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={StyleSheet.flatten([
            textStyles.subtitle,
            { color: textColor },
            textStyle,
          ])}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});

// Example:
// <Button title="Save Reminder" onPress={handleSave} />

