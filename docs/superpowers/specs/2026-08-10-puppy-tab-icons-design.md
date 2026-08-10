# Puppy Metaphor Tab Icons Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Approach:** Soft pet metaphors as custom outline/filled SVG paths in `MaterialIcon` (Approach A)

## Goal

Make side-tab icons feel like a puppy / pet-care app (playful metaphors) while keeping the floating notched tab bar, sliding accent pill, and existing press/bounce interaction.

## Decisions

| Topic | Choice |
| --- | --- |
| Style | Soft pet metaphors (not generic Material home/kit/chart/gear) |
| Implementation | New SVG path glyphs in `MaterialIcon` (outline + filled pairs) |
| Interaction | Keep outline → filled crossfade, press spring, activate bounce |
| Active colors | Filled icon uses `colors.text.inverse` on accent pill |
| Inactive colors | Outline icon uses `colors.text.subdued` |
| Center FAB | Unchanged paw FAB |
| Animation | Existing RN `Animated` only — no Reanimated |

## Icon mapping

| Tab | Metaphor | Filled name | Outline name |
| --- | --- | --- | --- |
| Home | House with a small paw | `home_paw` | `home_paw_outline` |
| Health | Bone with a medical cross | `bone_cross` | `bone_cross_outline` |
| Wellness | Heart with a tiny paw pad | `heart_paw` | `heart_paw_outline` |
| Settings | Collar-tag / rounded gear | `collar_settings` | `collar_settings_outline` |
| Center FAB | Existing paw | (unchanged) | (unchanged) |

## Scope

### In

1. Add eight new icon paths (4 filled + 4 outline) to `MaterialIcon`.
2. Wire `PawTabBar` `TabSlot` to the new icon names via `TAB_OUTLINE`.
3. Keep accessibility labels (“Home”, “Health records”, “Wellness”, “Settings”).
4. Keep silhouette readable at 24px tab size.

### Out

1. Redesigning the floating bar shell, scoop, or pill motion.
2. Changing tab destinations or FAB / long-press pet picker.
3. Replacing icons with existing Dog/Cat/Vaccine SVG assets.
4. Adding Reanimated or new icon packages.

## Constraints

- Theme tokens only for colors (no hardcoded brand hex in tab UI).
- Icons must remain monochrome paths tintable via `color`.
- Outline and filled variants should share the same optical weight at rest so the crossfade does not jump.
- Do not break existing `MaterialIcon` consumers; add new names rather than repurposing `home` / `settings` / etc. if those are used elsewhere.

## Acceptance

1. Side tabs show pet metaphors (house+paw, bone+cross, heart+paw, collar/gear).
2. Inactive looks outline; active looks filled on the accent pill.
3. Press and activate bounce still feel responsive.
4. Center paw FAB behavior unchanged.
5. Typecheck / existing tab motion tests still pass.
