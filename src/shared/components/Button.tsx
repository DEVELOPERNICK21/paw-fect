import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppText } from './AppText';
import { space } from '../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  leftAccessory,
  rightAccessory,
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.surface
      : colors.danger;

  const borderColor = variant === 'secondary' ? colors.primary : 'transparent';

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
          justifyContent: 'center',
          alignItems: 'center',
          // paddingVertical: space('sm'),
          // paddingHorizontal: space('lg'),
          // paddingBottom: space('xs'),
          padding: 0,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ])}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View
          style={StyleSheet.flatten([
            styles.content,
            { columnGap: space('xs') },
          ])}
        >
          {leftAccessory ? (
            <View style={styles.accessory}>{leftAccessory}</View>
          ) : null}

          <AppText
            style={StyleSheet.flatten([
              textStyles.subtitle,
              {
                color: textColor,
              },
              textStyle,
            ])}
          >
            {title}
          </AppText>
          {rightAccessory ? (
            <View style={styles.accessory}>{rightAccessory}</View>
          ) : null}
        </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessory: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space('xs'),
    marginLeft: space('xs'),
  },
});

// Example:
// <Button title="Save Reminder" onPress={handleSave} />
