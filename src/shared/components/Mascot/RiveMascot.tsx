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
import { createTapLadder, gazeFromTouch, moodAllowsIdleLife, type Gaze } from './mascotInteraction';
import { createMascotReactionGate } from './mascotReactions';
import { useMascotLife } from './useMascotLife';
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
  /**
   * Fidget when left alone (glances around, now and then a curious "hm?"). Defaults to `interactive`.
   * Never while asleep, busy, celebrating or nudging; at most one unprompted reaction a minute.
   */
  lively?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const LOOK_RESET_MS = 1400;
/** Finger movement is followed at roughly 30 frames a second, no faster. */
const TOUCH_MOVE_MIN_MS = 33;
const DEFAULT_REQUEST_TTL_MS = 6000;

/**
 * Plays the designer-made Rive mascot and drives it from app state:
 * - `mood` is bound to the file's view model (written only when it changes);
 * - `ref.react(reaction)` fires one of the six reaction triggers, throttled by a
 *   priority gate so repeated calls never restart a playing animation;
 * - the eyes follow the finger (touch, drag); a tap fires `pet`, and quick repeats escalate to a
 *   playful then an excited reaction; left alone it fidgets (see `lively`);
 * - frames stop while the app is backgrounded or `paused` is set.
 */
export const RiveMascot = forwardRef<MascotHandle, RiveMascotProps>(function RiveMascotView(
  {
    source,
    mood,
    size,
    interactive,
    onPress,
    onFailed,
    paused = false,
    reactionRequest,
    lively,
    accessibilityLabel,
    testID,
  },
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

  /** Point the eyes at `gaze`, and glance back to the middle after `holdMs` unless told again. */
  const holdLook = useCallback(
    (gaze: Gaze, holdMs: number = LOOK_RESET_MS): void => {
      if (!shouldPlayRef.current || !readyRef.current) {
        return;
      }
      setLookX(gaze.x);
      setLookY(gaze.y);
      riveViewRef?.playIfNeeded();
      if (lookTimer.current) {
        clearTimeout(lookTimer.current);
      }
      lookTimer.current = setTimeout(() => {
        lookTimer.current = null;
        setLookX(0);
        setLookY(0);
        riveViewRef?.playIfNeeded();
      }, holdMs);
    },
    [riveViewRef, setLookX, setLookY],
  );
  const look = useCallback(
    (x: number, y: number, holdMs?: number): void => holdLook({ x, y }, holdMs),
    [holdLook],
  );
  useImperativeHandle(ref, () => ({ react, look }), [react, look]);

  // Left alone, a calm character glances around and now and then asks "hm?". A touch restarts the quiet.
  const tapLadder = useRef(createTapLadder()).current;
  const fidgets = (lively ?? interactive) && moodAllowsIdleLife(mood);
  const { poke } = useMascotLife({ enabled: fidgets && ready && shouldPlay, react, look });

  // The eyes follow the finger from the moment it lands, through a drag, until a moment after it lifts.
  const lastTouchAt = useRef(0);
  const handleTouch = useCallback(
    (event: GestureResponderEvent) => {
      const at = Date.now();
      if (at - lastTouchAt.current < TOUCH_MOVE_MIN_MS) {
        return;
      }
      lastTouchAt.current = at;
      const { locationX, locationY } = event.nativeEvent;
      holdLook(gazeFromTouch(locationX, locationY, size));
      poke();
    },
    [holdLook, poke, size],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (shouldPlayRef.current && readyRef.current) {
        const { locationX, locationY } = event.nativeEvent;
        holdLook(gazeFromTouch(locationX, locationY, size));
        // One tap is the heart; quick repeats escalate (see `createTapLadder`).
        react(tapLadder.tap());
        poke();
      }
      onPress?.();
    },
    [onPress, react, holdLook, tapLadder, poke, size],
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
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
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
