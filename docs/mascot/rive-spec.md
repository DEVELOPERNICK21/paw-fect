# Pawfect mascot: Rive animation spec (hand this to the Rive animator)

Goal: one polished, genuinely cute, **interactive** puppy (and later a kitten) that reacts
to what the user does in the app. Hand-coded vector art cannot reach this quality, so the
character is produced in the Rive editor as a state machine and played with Rive's React
Native runtime.

## Cuteness checklist (research: "baby schema")
Large round head, big eyes set low on the face, small nose and mouth, puffy cheeks,
short thick limbs, plump body, soft rounded shapes, warm colours, a glint in the eyes.
Reference quality: the Rive Marketplace "Interactive Dog Mascot" (shows the bar).
Style reference only: do not copy any existing character.

## Character
- Golden-retriever puppy, original design, front or 3/4 sitting pose.
- Palette: golden `#F5C873` / cream `#FFF3D6` / warm brown outline, with brand accents
  orange `#F28C28` and turquoise `#2FA39B` (e.g. collar). Transparent background.
- No watermark, no baked-in text, no ground shadow baked into the body (separate shadow).

## Interaction contract (what engineering will bind to)
Use a **View Model** (data binding, the runtime's recommended path) named `Mascot`:

| Property | Type | Meaning |
|---|---|---|
| `mood` | Enum | `happy`, `wave`, `curious`, `nudge`, `thinking`, `proud`, `celebrating`, `sleepy` |
| `lookX`, `lookY` | Number (-1..1) | Eyes and head follow a point (tap position / scroll) |
| `tap` | Trigger | Playful reaction: squish + wink + tail wag |
| `celebrate` | Trigger | One-shot jump with confetti, then returns to `mood` |
| `petted` | Trigger | Happy wiggle, ears back, eyes closed (long-press) |

Mood meanings: `nudge` = gentle concern (never sad or angry); `curious` = head tilt, one
brow up; `thinking` = eyes up; `proud` = chest out, eyes closed; `sleepy` = slow breathing.

## Always-on idle life (no input needed)
Blink every 3-5 s, breathing, tail wag speed tied to mood, random ear flick, subtle
head sway. Transitions between moods blend smoothly (no popping).

## Technical requirements
- Deliver the editable `.rive` source and the exported `.riv` (Rive editor export needs a
  paid plan; the animator handles this).
- File size under 400 KB; smooth on low-end Android (target 60 fps, cap 30 fps if needed).
- One artboard, mouth shapes as separate states so moods blend with expressions.
- A still "reduced motion" pose we can show when the OS Reduce Motion setting is on.
- Name the artboard `Mascot` and the state machine `Main`.

## Licence (non-negotiable)
Full commercial rights **assigned to us**, exclusive to Pawfect. No attribution
requirement, no resale of the character. Written confirmation of originality.

## Our runtime (already compatible)
`@rive-app/react-native` v2 (Nitro-based) needs React Native 0.78+, iOS 15.1+, Android
SDK 24+, Xcode 16.4+, JDK 17+, and `react-native-nitro-modules` 0.33.2+. This project is on
React Native 0.86, iOS 15.5, Android 24 and Nitro 0.35, so no upgrade is needed.
The existing `<Mascot mood species size />` API stays the same; engineering swaps the
renderer behind it and keeps the code-drawn mascot as a fallback.
