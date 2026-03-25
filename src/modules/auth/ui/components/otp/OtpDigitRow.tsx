import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OTP_COLORS } from '../../screens/OtpScreen.styles';
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

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  box: {
    width: 42,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OTP_COLORS.outline,
    backgroundColor: OTP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: OTP_COLORS.primary,
    backgroundColor: OTP_COLORS.surface,
    shadowColor: OTP_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
  },
  valueDigit: {
    color: OTP_COLORS.onSurface,
  },
  valuePlaceholder: {
    color: OTP_COLORS.outline,
  },
});

export default OtpDigitRow;
