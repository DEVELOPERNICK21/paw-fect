# Pawfect mascot: art brief (for an illustrator or an AI-assisted artist)

## Why this exists
The current in-app mascot is code-drawn vector art. It is a working placeholder, not
final art. Quality like the reference (a golden-retriever puppy with soft shading, thin
crisp outline and feathered fur) needs real illustration. This brief is what to hand over
so we can animate the result.

## Style reference
> The reference image we used is a **watermarked stock illustration** (Shutterstock). It is
> *not* licensed to us. It may be shown to an illustrator as a mood/style reference only.
> Do **not** trace, redraw closely, remove its watermark, or ship it. The final character
> must be a new, original design that we own exclusively.

Soft, friendly, "sticker" illustration: thin dark-brown outline, soft cream/golden
shading, glossy eyes with highlights, feathered fur on ears / chest / tail, pink tongue,
pink paw pads. Warm, never scary, never sad or angry.

## Characters
1. **Golden-retriever puppy** (hero, matches the reference).
2. **Orange tabby kitten** (same style, same proportions) for cat owners.
Collar optional (a small turquoise collar with a bone/heart tag helps brand colour).

## Brand colours
Orange `#F28C28`, warm cream `#FFF1D8`, navy text `#0F172A`, accent turquoise `#2FA39B`.

## Deliverables (per character)
Layered source (PSD, AI, Figma or SVG) **and** exports, 2048 px on the long side,
transparent background, no baked-in shadow (provide the ground shadow as its own layer).

### Separate layers (needed so we can animate)
- Tail (own layer, with a clean base so it can pivot)
- Body + haunch + back leg
- Front legs / paws (raised-paw variant for waving)
- Chest fluff
- Head base (no eyes, no mouth)
- Left ear, right ear (each separate, with a clean top so they can flick)
- Eyes: open, closed-happy (^ ^), closed-sleepy (u u), wink
- Mouths: smile, open smile with tongue, small "o", closed gentle smile, big laugh
- Eyebrows (optional, for emotion)
- Collar + tag as its own layer (tag swings)

### Expressions to deliver as a full pose or as face-layer swaps
happy, wave (wink + raised paw), curious (head tilt, one brow up), nudge (gentle
concern: lifted inner brows, glossy eyes, small smile; never sad or angry), thinking
(eyes up, thought bubble), proud (eyes closed, big smile), celebrating (laughing, confetti),
sleepy (eyes closed, "zzz").

## Rules
- One consistent character across all expressions (same proportions, colours, markings).
- Original art with full commercial rights assigned to us. If any AI tool is used, keep the
  tool's terms, prompt and version, and confirm commercial use is allowed. AI-only art may
  not be copyrightable or trademarkable, so a human illustrator should finish and own the
  final character.
- Do not copy an existing character or brand.
- No medical imagery (no syringes, stethoscopes) on the mascot.

## What engineering does with it
Layers map one-to-one to the animation rig in `src/shared/components/Mascot/`
(tail wag, ear flick, breathing, tag swing, blink, wink, head tilt, wave, hop).
The `Mascot` component API (`mood`, `species`, `size`) does not change, so screens
need no edits when the final art arrives.
