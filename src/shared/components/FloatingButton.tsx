import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon, type IconProps } from './Icon';

export interface FloatingButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  icon?: Pick<IconProps, 'name'>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  icon = { name: '+' },
  style,
  accessibilityLabel,
}) => {
  const { colors, shadows } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={StyleSheet.flatten([
        styles.button,
        {
          backgroundColor: colors.primary,
        },
        shadows.lg,
        style,
      ])}
    >
      <View>
        <Icon name={icon.name} color={colors.text.inverse} />
      </View>
    </TouchableOpacity>
  );
};

const SIZE = 56;

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Example:
// <FloatingButton onPress={onAddReminder} />

