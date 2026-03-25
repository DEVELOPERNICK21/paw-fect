import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { OTP_COLORS } from '../../screens/OtpScreen.styles';
import { MaterialIcon } from '../../../../../shared/components/MaterialIcon';

type OtpTopBarProps = {
  onBack: () => void;
};

export const OtpTopBar: React.FC<OtpTopBarProps> = ({ onBack }) => {
  return (
    <Pressable
      onPress={onBack}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <MaterialIcon
        name="arrow_back"
        size={26}
        color={OTP_COLORS.onSurface}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OTP_COLORS.outline,
    backgroundColor: OTP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});

export default OtpTopBar;
