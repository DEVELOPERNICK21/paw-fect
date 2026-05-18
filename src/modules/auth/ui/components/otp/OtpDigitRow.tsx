import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { AppText } from '../../../../../shared/components/AppText';

type OtpDigitRowProps = {
  otp: string;
  isFocused: boolean;
  onPress: () => void;
  fontFamilyBold: string;
};

export const OtpDigitRow: React.FC<OtpDigitRowProps> = ({
  otp,
  isFocused,
  onPress,
  fontFamilyBold,
}) => {
  const { colors, radius, fontSizes, shadows, spacing } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        box: {
          width: spacing.xl + spacing.lg + spacing.xs,
          height: spacing['5xl'],
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        boxActive: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          ...shadows.sm,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: spacing.xs },
          shadowOpacity: 0.15,
          shadowRadius: spacing.sm,
          elevation: 2,
        },
        value: {
          fontSize: fontSizes.lg + spacing.xxs,
          lineHeight: spacing.xl,
        },
        valueDigit: {
          color: colors.text.heading,
        },
        valuePlaceholder: {
          color: colors.borderSubtle,
        },
      }),
    [
      colors.borderSubtle,
      colors.primary,
      colors.surface,
      colors.text.heading,
      fontSizes.lg,
      radius.lg,
      shadows.sm,
      spacing,
    ],
  );

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = otp[index] ?? '';
        const hasDigit = Boolean(digit);
        const isActive = isFocused && index === otp.length && otp.length < 6;
        return (
          <View
            key={index}
            style={[styles.box, isActive ? styles.boxActive : undefined]}
          >
            <AppText
              style={[
                styles.value,
                hasDigit ? styles.valueDigit : styles.valuePlaceholder,
                { fontFamily: fontFamilyBold },
              ]}
            >
              {digit || '•'}
            </AppText>
          </View>
        );
      })}
    </Pressable>
  );
};

export default OtpDigitRow;
