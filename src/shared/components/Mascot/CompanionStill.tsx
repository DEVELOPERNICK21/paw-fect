import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { COMPANION_STILL } from './mascotRiveSource';

export interface CompanionStillProps {
  size: number;
  interactive: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * The companion without animation: used when Reduce Motion is on, when the Rive file fails
 * to load, and for `animated={false}`. It is the same artwork and framing as the Rive file's
 * rest pose, so switching between the two does not make the character jump.
 */
export const CompanionStill: React.FC<CompanionStillProps> = ({
  size,
  interactive,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const image = (
    <Image
      source={COMPANION_STILL}
      resizeMode="contain"
      style={StyleSheet.flatten([{ width: size, height: size }])}
    />
  );

  if (interactive) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Companion'}
      >
        {image}
      </Pressable>
    );
  }
  const decorative = accessibilityLabel == null;
  return (
    <View
      testID={testID}
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      accessibilityElementsHidden={decorative}
    >
      {image}
    </View>
  );
};
