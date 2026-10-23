import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';

import { useReduceMotion } from '../../hooks/useReduceMotion';
import { CompanionStill } from './CompanionStill';
import { RiveMascot } from './RiveMascot';
import { COMPANION_RIVE_SOURCE } from './mascotRiveSource';
import { useScreenFocused } from './useScreenFocused';
import type { MascotHandle, MascotMood, MascotReactionRequest, MascotSpecies } from './mascotTypes';

export interface MascotProps {
  mood: MascotMood;
  /**
   * Ignored: the companion looks the same for every pet. Kept so existing callers
   * do not have to change.
   */
  species?: MascotSpecies;
  size?: number;
  /**
   * Tap enabled. Defaults to `true` when `onPress` is given. A tap plays the
   * `pet` reaction (and the character glances at the touch point).
   */
  interactive?: boolean;
  /** Called after a tap. */
  onPress?: () => void;
  /** Stop drawing and ignore reactions while hidden (e.g. the screen is not focused). */
  paused?: boolean;
  /**
   * Play a reaction once, as soon as the animation is loaded and visible. Ignored while the
   * still image is showing. See `MascotReactionRequest`.
   */
  reactionRequest?: MascotReactionRequest | null;
  /**
   * Let the character fidget when left alone: it glances around and, now and then, asks "hm?".
   * Defaults to on for interactive mascots and off for decorative ones. Never while it is asleep,
   * busy (thinking) or nudging, and never more than one unprompted reaction a minute.
   */
  lively?: boolean;
  /** Mascots are decorative by default; pass a label only when it carries meaning. */
  accessibilityLabel?: string;
  /** Show the still image instead of the animation (e.g. inside a long list). Reduce Motion also does. */
  animated?: boolean;
  testID?: string;
}

const NO_REACTIONS: MascotHandle = { react: () => false, look: () => undefined };

/** The still image has no reaction animations; its handle says so honestly. */
const StillMascot = forwardRef<MascotHandle, MascotProps>(function StillMascotView(props, ref) {
  useImperativeHandle(ref, () => NO_REACTIONS, []);
  return (
    <CompanionStill
      size={props.size ?? 96}
      interactive={props.interactive ?? props.onPress != null}
      onPress={props.onPress}
      accessibilityLabel={props.accessibilityLabel}
      testID={props.testID}
    />
  );
});

/**
 * The app's character, the hooded companion. Plays the Rive animation; with Reduce Motion on,
 * `animated={false}`, or if the file fails to load, it shows the same artwork as a still image.
 *
 * `ref` exposes a typed `MascotHandle` (`react('success')`, ...). It reports `false` whenever a
 * reaction did not actually start (still image showing, paused, not loaded, or throttled).
 */
export const Mascot = forwardRef<MascotHandle, MascotProps>(function MascotView(props, ref) {
  const reduceMotion = useReduceMotion();
  const screenFocused = useScreenFocused();
  const [riveFailed, setRiveFailed] = useState(false);
  const onFailed = useCallback(() => setRiveFailed(true), []);
  // The Rive view unmounts whenever the screen loses focus, so "already played" must live here.
  const [settledRequestId, setSettledRequestId] = useState<string | number | null>(null);
  const reactionRequest =
    props.reactionRequest != null && props.reactionRequest.id !== settledRequestId
      ? props.reactionRequest
      : null;

  if (riveFailed || reduceMotion || props.animated === false) {
    return <StillMascot ref={ref} {...props} />;
  }
  const size = props.size ?? 96;
  if (!screenFocused) {
    // Release the native surface while this tab is in the background.
    return <View style={{ width: size, height: size }} />;
  }
  const interactive = props.interactive ?? props.onPress != null;
  return (
    <RiveMascot
      ref={ref}
      source={COMPANION_RIVE_SOURCE}
      mood={props.mood}
      size={size}
      interactive={interactive}
      onPress={props.onPress}
      onFailed={onFailed}
      paused={props.paused}
      reactionRequest={reactionRequest}
      onReactionRequestSettled={setSettledRequestId}
      lively={props.lively}
      accessibilityLabel={props.accessibilityLabel ?? (interactive ? 'Companion' : undefined)}
      testID={props.testID}
    />
  );
});
