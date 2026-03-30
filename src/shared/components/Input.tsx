import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Icon, type IconProps } from './Icon';
import { AppText } from './AppText';

export interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: Pick<IconProps, 'name'>;
  rightIcon?: Pick<IconProps, 'name'>;
  errorText?: string;
}

export const Input: React.FC<InputProps> = ({
  containerStyle,
  fieldStyle,
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
          fieldStyle,
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
          allowFontScaling={false}
          maxFontSizeMultiplier={1}
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
        <AppText
          style={StyleSheet.flatten([
            textStyles.caption,
            styles.errorText,
            { color: colors.danger },
          ])}
        >
          {errorText}
        </AppText>
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
