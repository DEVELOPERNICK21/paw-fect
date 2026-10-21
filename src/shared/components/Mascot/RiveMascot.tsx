import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import {
  Fit,
  RiveView,
  useRive,
  useRiveEnum,
  useRiveFile,
  useRiveNumber,
  useRiveTrigger,
  useViewModelInstance,
} from '@rive-app/react-native';

import { RIVE_PROPS, type MascotRiveSource } from './mascotRiveSource';
import type { MascotMood } from './mascotTypes';

export interface RiveMascotProps {
  source: NonNullable<MascotRiveSource>;
  mood: MascotMood;
  size: number;
  onPress?: () => void;
  /** Called once if the file or its view model cannot be loaded. */
  onFailed: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const LOOK_RESET_MS = 1400;

/**
 * Plays the designer-made Rive mascot and drives it from app state:
 * `mood` is bound to the file's view model, a tap fires the `tap` trigger and
 * makes the character look toward the touch, then relax again.
 */
export const RiveMascot: React.FC<RiveMascotProps> = ({
  source,
  mood,
  size,
  onPress,
  onFailed,
  accessibilityLabel,
  testID,
}) => {
  const { riveFile, error: fileError } = useRiveFile(source);
  const { riveViewRef, setHybridRef } = useRive();
  const { instance, error: instanceError } = useViewModelInstance(riveFile, {
    async: true,
    onInit: vmi => {
      vmi.enumProperty(RIVE_PROPS.mood)?.set(mood);
    },
  });

  const { setValue: setMood } = useRiveEnum(RIVE_PROPS.mood, instance);
  const { setValue: setLookX } = useRiveNumber(RIVE_PROPS.lookX, instance);
  const { setValue: setLookY } = useRiveNumber(RIVE_PROPS.lookY, instance);
  const { trigger: fireTap } = useRiveTrigger(RIVE_PROPS.tap, instance);

  const failed = fileError != null || instanceError != null;
  const failedRef = useRef(false);
  useEffect(() => {
    if (failed && !failedRef.current) {
      failedRef.current = true;
      onFailed();
    }
  }, [failed, onFailed]);

  useEffect(() => {
    setMood(mood);
    riveViewRef?.playIfNeeded();
  }, [mood, setMood, riveViewRef]);

  const lookTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (lookTimer.current) {
        clearTimeout(lookTimer.current);
      }
    },
    [],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      // -1..1 from the view centre so the character glances at the touch.
      setLookX(((locationX / size) - 0.5) * 2);
      setLookY(((locationY / size) - 0.5) * 2);
      fireTap();
      riveViewRef?.playIfNeeded();
      if (lookTimer.current) {
        clearTimeout(lookTimer.current);
      }
      lookTimer.current = setTimeout(() => {
        setLookX(0);
        setLookY(0);
        riveViewRef?.playIfNeeded();
      }, LOOK_RESET_MS);
      onPress?.();
    },
    [fireTap, onPress, riveViewRef, setLookX, setLookY, size],
  );

  const box = { width: size, height: size };
  const view =
    riveFile && instance ? (
      <RiveView
        hybridRef={setHybridRef}
        file={riveFile}
        fit={Fit.Contain}
        dataBind={instance}
        style={StyleSheet.flatten([box])}
      />
    ) : (
      <View style={box} />
    );

  if (onPress) {
    return (
      <Pressable testID={testID} onPress={handlePress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Pet mascot'}>
        {view}
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
      {view}
    </View>
  );
};
