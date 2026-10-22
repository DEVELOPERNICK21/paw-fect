import type { MascotReaction } from './mascotTypes';

/**
 * The companion's Rive file. It must follow the contract in `docs/mascot/rive-spec.md` (artboard
 * `Mascot`, state machine `Main`, view model `Mascot` with `mood`, `lookX`, `lookY` and the six
 * reaction triggers). Metro bundles a `.riv` like any other asset and `require` yields its asset id.
 */
export type MascotRiveSource = number | { uri: string };

export const COMPANION_RIVE_SOURCE: MascotRiveSource =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../assets/rive/pawfect-companion.riv');

/** The same artwork as a still image: Reduce Motion, `animated={false}`, or a file that fails to load. */
export const COMPANION_STILL: number =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../assets/rive/pawfect-companion-still.png');

/** View-model property names the Rive file must expose (see rive-spec.md). */
export const RIVE_PROPS = {
  mood: 'mood',
  lookX: 'lookX',
  lookY: 'lookY',
  pet: 'pet',
  welcome: 'welcome',
  success: 'success',
  celebrate: 'celebrate',
  curious: 'curious',
  attention: 'attention',
} as const;

/** Reaction -> trigger property. Identical names today; kept explicit so a rename is one edit. */
export const RIVE_TRIGGER_FOR: Record<MascotReaction, string> = {
  pet: RIVE_PROPS.pet,
  welcome: RIVE_PROPS.welcome,
  success: RIVE_PROPS.success,
  celebrate: RIVE_PROPS.celebrate,
  curious: RIVE_PROPS.curious,
  attention: RIVE_PROPS.attention,
};
