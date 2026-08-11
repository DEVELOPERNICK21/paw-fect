import React, { useMemo } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';

const FIELD_HEIGHT = 56;

type ThemeParams = ReturnType<typeof useTheme>;

const createFieldStyles = ({ colors, radius, spacing }: ThemeParams) =>
  StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: FIELD_HEIGHT,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
    },
    accessory: {
      marginRight: spacing.sm,
    },
    trailingAccessory: {
      marginLeft: spacing.sm,
    },
  });

export interface PetFilledTextInputProps extends Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'autoCapitalize' | 'autoCorrect'
> {
  leftAccessory?: React.ReactNode;
}

export const PetFilledTextInput: React.FC<PetFilledTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  leftAccessory,
  autoCapitalize,
  autoCorrect,
}) => {
  const theme = useTheme();
  const { colors, textStyles } = theme;
  const styles = useMemo(() => createFieldStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      {leftAccessory ? (
        <View style={styles.accessory}>{leftAccessory}</View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.input.placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[textStyles.control, { flex: 1, color: colors.text.heading }]}
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
      />
    </View>
  );
};

export interface PetFilledRowProps {
  title: string;
  onPress: () => void;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const PetFilledRow: React.FC<PetFilledRowProps> = ({
  title,
  onPress,
  leftAccessory,
  rightAccessory,
  accessibilityLabel,
  style,
}) => {
  const theme = useTheme();
  const { colors, textStyles } = theme;
  const styles = useMemo(() => createFieldStyles(theme), [theme]);

  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[styles.field, style]}
    >
      {leftAccessory ? (
        <View style={styles.accessory}>{leftAccessory}</View>
      ) : null}
      <AppText
        style={[textStyles.control, { flex: 1, color: colors.text.heading }]}
      >
        {title}
      </AppText>
      {rightAccessory ? (
        <View style={styles.trailingAccessory}>{rightAccessory}</View>
      ) : null}
    </ScalePressable>
  );
};
