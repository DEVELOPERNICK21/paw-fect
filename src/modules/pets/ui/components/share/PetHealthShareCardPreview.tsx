import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import type { PetHealthCardViewModel } from '../../../domain/models/PetHealthCardViewModel';
import { PetHealthShareCardSkia } from './PetHealthShareCardSkia';

export interface PetHealthShareCardPreviewProps {
  viewModel: PetHealthCardViewModel;
  width: number;
  height: number;
  borderColor: string;
  shadowStyle: ViewStyle;
}

export const PetHealthShareCardPreview: React.FC<PetHealthShareCardPreviewProps> = ({
  viewModel,
  width,
  height,
  borderColor,
  shadowStyle,
}) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const opacity = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="image"
      accessibilityLabel="Pet health card preview"
    >
      <Animated.View
        style={[
          styles.previewPressable,
          shadowStyle,
          {
            opacity,
            transform: [{ scale: pressed ? 0.985 : scale }],
          },
        ]}
      >
        <View
          style={[
            styles.previewClip,
            {
              width,
              height,
              borderColor,
            },
          ]}
        >
          <PetHealthShareCardSkia
            viewModel={viewModel}
            width={width}
            height={height}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  previewPressable: {
    marginBottom: 28,
  },
  previewClip: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
