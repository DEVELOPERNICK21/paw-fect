# Pawfect mascot: Rive animation contract

One interactive character, the **companion**, that reacts to what the user does in the app, played with
Rive's React Native runtime. This file is the contract between the `.riv` file and the app code. Usage of the
component is in [`mascot-reactions.md`](./mascot-reactions.md).

## Files
| What | Where | Size |
|---|---|---|
| Animation | `src/shared/assets/rive/pawfect-companion.riv` | 181 KB |
| Still image (Reduce Motion, `animated={false}`, load failure) | `src/shared/assets/rive/pawfect-companion-still.png` | 58 KB |
| File registry + property names | `src/shared/components/Mascot/mascotRiveSource.ts` | |
| Component | `src/shared/components/Mascot/Mascot.tsx` + `RiveMascot.tsx` + `CompanionStill.tsx` | |

These two assets are the only mascot art in the app bundle. Nothing is bundled per species.

## Character
A small child in a white hood with two glowing antennae, a headphone cup with a star, orange jacket, backpack
and shorts, shown walking. One look for every user: the `species` prop is accepted for compatibility but ignored.
Hand-redrawn as layered vector shapes from the "Pawfect Companion Character" sheet (a soft 3D render), so it is a
clean flat-gradient rebuild, not an exact copy. Transparent background; a soft ground shadow is part of the file.

## Rive contract
Runtime: `@rive-app/react-native` 0.5.5 (Nitro). Its legacy state-machine inputs are removed and throw,
so **everything is driven through View Model data binding**, never `setNumberInputValue` / `triggerInput`.

- Artboard: `Mascot` (1200 x 1200, character centred, room on the right for the floating props and headroom for jumps)
- State machine: `Main` (default). Layers: `Pose`, `FaceHold`, `FacePop`, `Blink`, `Float`, `React`
- View model: `Mascot`, default instance `Default`

| Property | Type | Meaning |
|---|---|---|
| `mood` | Enum `happy, wave, curious, nudge, thinking, proud, celebrating, sleepy` | Persistent state. Loops until changed. Default `happy`. |
| `lookX`, `lookY` | Number, -1..1 | The whole face (eyes, mouth, blush) shifts by up to 40 / 26 artboard units (a visible glance even at 76 pt). A finger touching or dragging over the character, the idle glances and `ref.look()` drive it. |
| `pet` | Trigger | Eyes closed and content, stronger blush, orange heart, head tilt, antennae wiggle. |
| `welcome` | Trigger | Open smile, sparkles, two bounces, arm waves. |
| `success` | Trigger | Open smile, sparks, happy bounce, antennae flap. |
| `celebrate` | Trigger | `>` `<` eyes, big laugh, sparks both sides, three jumps, arm and legs swing. |
| `curious` | Trigger | Forehead dots, orange "?", head tilt, one antenna up. |
| `attention` | Trigger | Round eyes, small "o", orange "!", calm lift, antennae perk. No alarm, no shaking. |

A trigger plays once and the machine returns to the current `mood` on its own (0.3 s crossfade). Changing `mood`
while a reaction plays takes effect when the reaction ends. A new trigger fired during a reaction interrupts it, so
the app gates triggers (see `mascotReactions.ts`). A reaction replaces the face for its duration and hands it back:
each mood's face is a looping layer that is always re-applied, so nothing sticks.

### Moods (looping)
| Mood | Face and props | Motion |
|---|---|---|
| `happy` | calm smile | breathing, gentle sway (default idle) |
| `wave` | open smile, small sparks | light bounce |
| `curious` | eyes closed in a happy curve with lashes, forehead dots, orange "?" | head tilted |
| `nudge` | calm smile, yellow bell (never sad or scolding) | bell rings |
| `thinking` | eyes closed, concentrating, small sparkle | head lowered ("working on it") |
| `proud` | one eye arched, one `<` eye, open smile, sparks on the left | gentle nod |
| `celebrating` | `>` `<` squint eyes, big laugh, sparks both sides | fast bounce |
| `sleepy` | eyes closed, softer blush, blue "Z Z" | slow breathing, head dips |

Blinking runs independently in every mood whose eyes are open. The props float gently and pop in when a mood or
reaction shows them.

### Reaction timings (keep in sync with `MASCOT_REACTION_PLAY_MS`)
`pet` 1.2 s, `welcome` 1.8 s, `success` 1.4 s, `celebrate` 2.6 s, `curious` 1.4 s, `attention` 1.6 s.

## Construction
- Native Rive vector paths with solid and gradient fills, strokes and clipping shapes. No bones: every part is a
  node with its pivot at the joint. 20 parts: Body, Head (hood shell and rim, face skin, face features), eyes,
  mouth, blush, antennae with glow, headphone cup, backpack, left arm, both legs, torso, strap, ground shadow, props.
- Parts overlap on purpose (the face sits under the hood rim, the torso under the jacket, the legs under the
  jacket hem) so nothing opens a gap while moving. Checked across 19 pose combinations.
- All 12 expressions drawn for the character are reachable: `Idle` (happy), `Happy` (wave), `Curious`, `Reminder`
  (nudge), `Working` (thinking), `Encouraging` (proud), `Excited` (celebrating), `Sleepy`, plus `Caring` (pet),
  `Playful` (welcome), `Thinking` (curious reaction) and `Surprised` (attention).
- The file is **generated by a script, not authored in the Rive editor**. It uses the object types the editor
  exports and loads in Rive's runtime, but opening it in the editor is untested. The generator source and the
  vector art are not in this repo; they were delivered separately (`companion-source.zip`). Keep them if the
  animation needs to change.
- Size 181 KB (limit 400 KB; about 68 KB once zipped in the app package).

### Limits
- Arm poses, the held laptop and the pillow from the character sheet are **not** drawn; props float beside the head.
- The right arm is part of the torso, so it only moves with the body.

## Verification status
**Web runtime** (`@rive-app/canvas` 2.44): loads with exactly this contract; all 8 moods render; 56 of 56
mood-to-mood switches land on the right face and props; every reaction fired from every mood (48 of 48) plays,
returns to the mood and restores its face; reaction lengths are within 15 ms of `MASCOT_REACTION_PLAY_MS`;
`lookX` / `lookY` move the eyes.

**Native, iOS 26.5 simulator** (`@rive-app/react-native` 0.5.5, Release build of a copy of the app with a test
screen using the real `Mascot` and `CompanionBubble`): the file loads and plays at 300 px and 76 px; moods and
reactions seen; the priority gate refused `success` right after `celebrate`.

**Not yet verified**: Android, a physical device, Reduce Motion (still image) on a device, tap-to-pet on the
companion, the signed-in Home screen, long-run performance and battery. See the checklist in
`mascot-reactions.md`.

`__tests__/riveFileContract.test.ts` reads the shipped file and fails if a view-model property, mood or trigger
name goes missing.

## Licence (non-negotiable)
Full commercial rights **assigned to us**, exclusive to Pawfect. No attribution requirement, no resale of the
character. The companion was hand-redrawn from a character sheet supplied by the product owner; confirm in writing
that we own the rights to that sheet before release.

## Our runtime (already compatible)
`@rive-app/react-native` v2 (Nitro-based) needs React Native 0.78+, iOS 15.1+, Android SDK 24+, Xcode 16.4+,
JDK 17+, and `react-native-nitro-modules` 0.33.2+. This project is on React Native 0.86, iOS 15.5, Android 24 and
Nitro 0.36, so no upgrade is needed. `metro.config.js` already lists `riv` as an asset extension and
`jest.config.js` maps `.riv` imports to a stub.
