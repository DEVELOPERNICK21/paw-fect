import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { OTP_COLORS } from '../../screens/OtpScreen.styles';
import { images } from '../../../../../shared/assets/images';

export const OtpBrandBadge: React.FC = () => {
  return (
    <View style={styles.iconTile}>
      <Image source={images.appIcon} style={styles.appIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconTile: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: OTP_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  appIcon: {
    width: 62,
    height: 62,
    resizeMode: 'contain',
  },
});

export default OtpBrandBadge;
