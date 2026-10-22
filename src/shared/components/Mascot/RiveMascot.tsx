import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
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

import { useAppIsActive } from '../../hooks/useAppIsActive';
import { createMascotReactionGate } from './mascotReactions';
import { RIVE_PROPS, RIVE_TRIGGER_FOR, type MascotRiveSource } from './mascotRiveSource';
import type { MascotHandle, MascotMood, MascotReaction, MascotReactionRequest } from './mascotTypes';

export interface RiveMascotProps {
  source: NonNullable<MascotRiveSource>;
  mood: MascotMood;
  size: number;
  /** Tap enabled. Tapping fires the `pet` reaction (throttled) and then calls `onPress`. */
  interactive: boolean;
  onPress?: () => void;
  /** Called once if the file or its view model cannot be loaded. */
  onFailed: () => void;
  /**
   * Stop drawing frames and ignore reactions (e.g. the screen lost focus). The
   * app being in the background pauses it automatically.
   */
  paused?: boolean;
  /** Play a reaction once, as soon as the mascot is loaded and visible (see `MascotReactionRequest`). */
  reactionRequest?: MascotReactionRequest | null;
  accessibilityLabel?: string;
  testID?: string;
}

const LOOK_RESET_MS = 1400;
const DEFAULT_REQUEST_TTL_MS = 6000;

/**
 * Plays the designer-made Rive mascot and drives it from app state:
 * - `mood` is bound to the file's view model (written only when it changes);
 * - `ref.react(reaction)` fires one of the six reaction triggers, throttled by a
 *   priority gate so repeated calls never restart a playing animation;
 * - a tap fires `pet` and makes the character glance at the touch point;
 * - frames stop while the app is backgrounded or `paused` is set.
 */
export const RiveMascot = forwardRef<MascotHandle, RiveMascotProps>(function RiveMascotView(
  { source, mood, size, interactive, onPress, onFailed, paused = false, reactionRequest, accessibilityLabel, testID },
  ref,
) {
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
  const triggerPet = useRiveTrigger(RIVE_TRIGGER_FOR.pet, instance).trigger;
  const triggerWelcome = useRiveTrigger(RIVE_TRIGGER_FOR.welcome, instance).trigger;
  const triggerSuccess = useRiveTrigger(RIVE_TRIGGER_FOR.success, instance).trigger;
  const triggerCelebrate = useRiveTrigger(RIVE_TRIGGER_FOR.celebrate, instance).trigger;
  const triggerCurious = useRiveTrigger(RIVE_TRIGGER_FOR.curious, instance).trigger;
  const triggerAttention = useRiveTrigger(RIVE_TRIGGER_FOR.attention, instance).trigger;
  const triggers = useMemo<Record<MascotReaction, () => void>>(
    () => ({
      pet: triggerPet,
      welcome: triggerWelcome,
      success: triggerSuccess,
      celebrate: triggerCelebrate,
      curious: triggerCurious,
      attention: triggerAttention,
    }),
    [triggerPet, triggerWelcome, triggerSuccess, triggerCelebrate, triggerCurious, triggerAttention],
  );

  const failed = fileError != null || instanceError != null;
  const failedRef = useRef(false);
  useEffect(() => {
    if (failed && !failedRef.current) {
      failedRef.current = true;
      onFailed();
    }
  }, [failed, onFailed]);

  // Foreground + not paused => playing. Everything below reads this.
  const appActive = useAppIsActive();
  const shouldPlay = appActive && !paused;
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  useEffect(() => {
    if (!riveViewRef) {
      return;
    }
    const result = shouldPlay ? riveViewRef.play() : riveViewRef.pause();
    Promise.resolve(result).catch(() => undefined);
  }, [shouldPlay, riveViewRef]);

  // Write the mood once per (instance, mood): re-renders must not replay anything.
  const syncedMood = useRef<{ instance: unknown; mood: MascotMood } | null>(null);
  useEffect(() => {
    if (instance == null) {
      return;
    }
    const last = syncedMood.current;
    if (last != null && last.instance === instance && last.mood === mood) {
      return;
    }
    syncedMood.current = { instance, mood };
    setMood(mood);
    riveViewRef?.playIfNeeded();
  }, [instance, mood, setMood, riveViewRef]);

  const gate = useRef(createMascotReactionGate()).current;
  const ready = instance != null;
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const react = useCallback(
    (reaction: MascotReaction): boolean => {
      if (!readyRef.current || !shouldPlayRef.current) {
        return false;
      }
      if (!gate.tryStart(reaction)) {
        return false;
      }
      triggers[reaction]();
      riveViewRef?.playIfNeeded();
      return true;
    },
    [gate, riveViewRef, triggers],
  );
  useImperativeHandle(ref, () => ({ react }), [react]);

  // Declarative request: waits (without timers) until the mascot is ready and visible, plays
  // once per id, and is dropped if it had to wait longer than its ttl. The effect re-runs
  // when `ready` / `shouldPlay` change, which is exactly when a waiting request can proceed.
  const requestSeen = useRef<{ id: string | number; at: number } | null>(null);
  const requestDone = useRef<string | number | null>(null);
  useEffect(() => {
    if (reactionRequest == null || requestDone.current === reactionRequest.id) {
      return;
    }
    if (requestSeen.current?.id !== reactionRequest.id) {
      requestSeen.current = { id: reactionRequest.id, at: Date.now() };
    }
    const ttl = reactionRequest.ttlMs ?? DEFAULT_REQUEST_TTL_MS;
    if (Date.now() - requestSeen.current.at > ttl) {
      requestDone.current = reactionRequest.id;
      return;
    }
    if (!ready || !shouldPlay) {
      return;
    }
    requestDone.current = reactionRequest.id;
    react(reactionRequest.reaction);
  }, [reactionRequest, ready, shouldPlay, react]);

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
      if (shouldPlayRef.current && readyRef.current) {
        const { locationX, locationY } = event.nativeEvent;
        // -1..1 from the view centre so the character glances at the touch.
        setLookX((locationX / size - 0.5) * 2);
        setLookY((locationY / size - 0.5) * 2);
        riveViewRef?.playIfNeeded();
        if (lookTimer.current) {
          clearTimeout(lookTimer.current);
        }
        lookTimer.current = setTimeout(() => {
          setLookX(0);
          setLookY(0);
          riveViewRef?.playIfNeeded();
        }, LOOK_RESET_MS);
        react('pet');
      }
      onPress?.();
    },
    [onPress, react, riveViewRef, setLookX, setLookY, size],
  );

  const box = { width: size, height: size };
  const view =
    riveFile && instance ? (
      <RiveView
        hybridRef={setHybridRef}
        file={riveFile}
        fit={Fit.Contain}
        autoPlay={shouldPlay}
        dataBind={instance}
        onError={onFailed}
        style={StyleSheet.flatten([box])}
      />
    ) : (
      <View style={box} />
    );

  if (interactive) {
    return (
      <Pressable
        testID={testID}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Pet mascot'}
      >
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
});
