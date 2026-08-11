import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Pressed scale; default ~0.97 for tactile cards/chips. */
  pressedScale?: number;
};

/**
 * Pressable with a light scale-down on press for onboarding selections / CTAs.
 */
export const ScalePressable: React.FC<Props> = ({
  children,
  style,
  pressedScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number): void => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 220,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={event => {
        if (!disabled) {
          animateTo(pressedScale);
        }
        onPressIn?.(event);
      }}
      onPressOut={event => {
        animateTo(1);
        onPressOut?.(event);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
