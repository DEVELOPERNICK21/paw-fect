import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputFocusEventData,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon, type IconProps } from './Icon';

export interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: Pick<IconProps, 'name'>;
  rightIcon?: Pick<IconProps, 'name'>;
  errorText?: string;
  onBlur?:
    | ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void)
    | undefined;
}

export const Input: React.FC<InputProps> = ({
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  placeholder,
  secureTextEntry,
  errorText,
  onBlur,
  ...rest
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  const hasError = Boolean(errorText);

  return (
    <View style={containerStyle}>
      <View
        style={StyleSheet.flatten([
          styles.inputContainer,
          {
            borderRadius: radius.md,
            paddingHorizontal: space('sm'),
            paddingVertical: space('xs'),
            borderColor: hasError ? colors.danger : colors.border,
            backgroundColor: colors.surface,
          },
        ])}
      >
        {leftIcon ? (
          <Icon
            name={leftIcon.name}
            style={styles.icon}
            color={colors.text.secondary}
          />
        ) : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={secureTextEntry}
          style={StyleSheet.flatten([
            styles.input,
            textStyles.body,
            { color: colors.text.primary },
            inputStyle,
          ])}
          onBlur={onBlur}
          {...rest}
        />
        {rightIcon ? (
          <Icon
            name={rightIcon.name}
            style={styles.icon}
            color={colors.text.secondary}
          />
        ) : null}
      </View>
      {hasError ? (
        <Text
          style={StyleSheet.flatten([
            textStyles.caption,
            styles.errorText,
            { color: colors.danger },
          ])}
        >
          {errorText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  icon: {
    marginHorizontal: 4,
  },
  errorText: {
    marginTop: 4,
  },
});

// Example:
// <Input placeholder="Pet Name" value={name} onChangeText={setName} />

