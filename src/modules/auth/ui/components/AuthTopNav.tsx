import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../shared/hooks/useTheme';

interface AuthTopNavProps {
  leftIcon: string;
  onLeftPress: () => void;
}

export const AuthTopNav: React.FC<AuthTopNavProps> = ({ leftIcon, onLeftPress }) => {
  const { fontFamilies } = useTheme();

  return (
    <View style={styles.topNav}>
      <Pressable style={styles.leftButton} onPress={onLeftPress} hitSlop={8}>
        <Text style={styles.leftIcon}>{leftIcon}</Text>
      </Pressable>

      <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>Pawfect</Text>

      <View style={styles.leftButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  topNav: {
    width: '100%',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    fontSize: 20,
    color: '#0F172A',
  },
  title: {
    fontSize: 17,
    lineHeight: 21,
    color: '#0F172A',
    letterSpacing: -0.45,
  },
});

export default AuthTopNav;
