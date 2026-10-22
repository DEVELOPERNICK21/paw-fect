# Mascot reactions: how to use them

The Rive contract (file, view model, triggers) is in [`rive-spec.md`](./rive-spec.md). This page is the
app-side usage.

> **Merge status.** On `main`: the companion `Mascot` (animation plus still image), the reaction gate and the
> `reactionRequest` prop, and the **pet-profile welcome** (`PetWelcomeMascot`, `welcome` when a pet is created).
> **Not merged yet** (written and tested, but its screens depend on the `CompanionBubble` / Home companion /
> health-summary work that is still uncommitted): the Care-tab reactions (`CareMascot`, `success`, `celebrate`,
> `attention`), the health-record `curious` reaction (`HealthMascot`), and the Home companion. Sections below that
> describe those say "not merged yet". Remove this note when they land.

## The component
There is one mascot component: `Mascot` in `src/shared/components/Mascot`. It always shows the companion: it plays
the Rive file, and shows the same artwork as a still image for Reduce Motion, `animated={false}` or a load failure.

```tsx
import { Mascot, type MascotHandle } from '<shared>/components/Mascot';

const mascotRef = useRef<MascotHandle>(null);

<Mascot
  ref={mascotRef}
  mood="happy"          // persistent state: MascotMood
  size={96}
  interactive           // tap = the `pet` reaction (and a glance toward the touch)
  onPress={...}         // optional callback after a tap
  paused={!isFocused}   // optional: stop drawing + ignore reactions while hidden
/>

mascotRef.current?.react('success');   // -> boolean (immediate, only if it can play right now)
```

For a reaction that may be asked for before the mascot is loaded or visible (e.g. the screen is mounted
but not yet focused), pass a **request** instead of calling the ref:

```tsx
<Mascot ... reactionRequest={{ reaction: 'welcome', id: 'pet-created:42' }} />
```
A request plays **once per `id`**, as soon as the Rive file is loaded and the mascot is visible (not `paused`,
app in the foreground). It is **dropped, not queued,** if it had to wait longer than `ttlMs` (default 6 s) or
if a higher-priority reaction is playing. Re-rendering with the same `id` never replays it; a new `id` plays again.

| Prop | Default | Notes |
|---|---|---|
| `mood` | required | `happy wave curious nudge thinking proud celebrating sleepy`. Written to the file only when it changes. |
| `size` | 96 | Square box in px. |
| `interactive` | `true` if `onPress` is set | Makes the mascot tappable. |
| `paused` | `false` | The app being backgrounded pauses it automatically. |
| `reactionRequest` | none | See above. Ignored while the still image is showing. |
| `animated` | `true` | `false` shows the still image (use inside long lists). |
| `species` | none | Ignored: the companion is the same for every pet. Still accepted so existing callers did not have to change. |

Reduce Motion: when the OS setting is on, the still image (`pawfect-companion-still.png`, same framing as the
animation) is shown instead of the Rive animation.

### Where it shows
The companion is the only character. Every screen that renders `<Mascot>` shows it: the pet-profile welcome
(`PetWelcomeMascot`), the share moment, onboarding's processing step and the reminders empty state are on `main`.
The Home companion (`HomeCompanion`), Care tab (`CareMascot`), Health record (`HealthMascot`) and the completion toast
use `<CompanionBubble>` or the Home work and are **not merged yet**. A reaction can be played on any `<Mascot>`.

### `MascotHandle.react(reaction)`
`reaction` is one of `pet welcome success celebrate curious attention`. It returns `true` **only if the reaction
actually started**. It returns `false` when:
- the Rive file or view model is not loaded yet, or the still image is showing;
- the mascot is paused (screen not focused, app in the background);
- a reaction of equal or higher priority is still playing. Priority: `celebrate` > `welcome` = `success` >
  `pet` = `curious` = `attention`. So a burst of taps plays `pet` once, a tap never cuts off `success`, and
  `celebrate` takes over from `success`.

Nothing in the component fires a trigger by itself: not on render, not on re-render, not on mood changes.

## Connecting a reaction to a real event
Business logic stays out of the animation code. The pattern, as used for care tasks:

1. **Domain**: the use case reports a real change (`MarkCareBlockDone` returns `{ completionChanged }`).
2. **Store**: after the data is saved, the store emits a typed event through a port
   (`scheduleComposition.careCompletionEvents`; the store function `subscribeToCareCompletions`).
3. **Pure mapping**: `mascotReactionForCareEvent(event)` in `schedule/domain/utils/careMascotReactions.ts`
   (task done -> `success`; first time the day is complete -> `celebrate`).
4. **UI glue**: `useCareCompletionReactions(mascotRef, petFilter)` subscribes and calls `ref.react(...)`.
5. **Where it shows**: `CareMascot` on the Care tab (`WellnessHubScreen`) (**not merged yet**).

### What counts as "a care task was completed"
An event is emitted only when a care block was **saved** and was **not already completed**:
not for a button press, not when the save fails, not when it is repeated, not when un-doing, not when nobody is
signed in. `dayCompleted` is true only the first time that pet's whole day becomes complete (it reads the streak
record, so un-doing and re-doing a task the same day does not celebrate again).

Completions marked from a notification action also go through `MarkCareBlockDone` but do not emit the event
(no screen is showing a mascot then). `wellnessStore.markTaskDone` is not used by any screen.

## Status of each requested behaviour
| Behaviour | Rive animation | Wired to a real event | Where you see it |
|---|---|---|---|
| Idle (breathing, blinks, tail) | yes (`mood = happy`) | always on | everywhere a mascot is shown |
| Pet (tap) | yes | yes: `interactive` mascots fire it on tap | any interactive mascot |
| Success (task completed) | yes | care completion event (**not merged yet**) | Care tab (not merged yet) |
| Celebrate (day complete) | yes | same event, `dayCompleted` (**not merged yet**) | Care tab (not merged yet) |
| Welcome (pet profile created) | yes | **yes**: `pet-created` event | Pet profile, when you land on it after adding a pet |
| Curious (open a health record) | yes | screen focus (**not merged yet**) | Health record screen (not merged yet) |
| Attention (overdue care) | yes (also `mood="nudge"`) | newly overdue task (**not merged yet**) | Care tab (not merged yet) |

### How each one is connected
All follow the same shape: *something real happens -> a pure function maps it to a reaction -> a small hook hands
it to the mascot*. Only where a domain event exists is there an event hub.

| | Source | Pure mapping | Hook | Host |
|---|---|---|---|---|
| success / celebrate (not merged yet) | `MarkCareBlockDone` -> `scheduleStore` emits `care-task-completed` after saving | `mascotReactionForCareEvent` | `useCareCompletionReactions` | `CareMascot` |
| welcome | `CreatePet` use case emits `pet-created` after the repository accepts the pet (covers the Add Pet form and onboarding) | `mascotReactionForPetCreated` | `usePetWelcomeReaction` | `PetWelcomeMascot` on `PetProfileScreen` |
| curious (not merged yet) | no store event: opening the screen *is* the event, tracked by `stepHealthRecordOpen` | `mascotReactionForRecordOpen` | `useHealthRecordOpenReaction` | `HealthMascot` on `HealthRecordScreen` |
| attention (not merged yet) | derived state: `overdueAttentionKeys` + `createOverdueAttentionTracker` | `mascotReactionForOverdue` | `useOverdueAttentionReaction` | `CareMascot` |

### What counts as each event
- **A care task was completed**: saved **and** not already completed (not a button press, not a failed save, not a
  repeat, not undo, not signed out). `dayCompleted` only the first time that pet's day becomes complete.
- **A pet profile was created**: the repository accepted it. A failed save emits nothing. The pet store swallows
  save errors, which is why the event comes from the use case and not the store.
- **A health record was opened**: the screen gains focus with a pet to show; again if the pet changes while focused;
  never twice for the same focus; never while unfocused.
- **Attention**: an overdue task shows that the mascot has not yet looked up for **today** (keys are
  `day|pet|task`). Not repeated on re-render, refresh, when a task is completed, or when one disappears and
  returns the same day. A new day starts fresh. Overdue is re-evaluated when the Care data refreshes, not as
  the clock ticks.

### Limits of the wiring (by design or not done)
- **welcome** only plays if the pet profile is on screen within 6 s of the pet being saved (the Add Pet form
  closes back to it). If you add a pet from the pet switcher, the welcome is dropped. The very first pet,
  created in onboarding or the pet-required screen, has **no host** (Home has no mascot yet), so no welcome plays.
- **curious** has no event for the data side: it fires when the screen opens, not when the records finish loading.
- Completions marked from a notification action do not emit the care event (no screen is showing a mascot then).
  `wellnessStore.markTaskDone` is not used by any screen.
- Reactions are never queued: one that cannot play promptly is dropped.

To wire another one: add the event (or a pure tracker), a pure mapping function with a test, a hook that returns
a `MascotReactionRequest` (or calls the handle), and mount a `Mascot` next to it.

## Performance and battery
- Frames stop while the app is backgrounded or `paused` is set (`play()` / `pause()` on the Rive view).
- The Care tab mascot is `paused` when the tab loses focus.
- No timers run in the component except a 1.4 s glance-reset after a tap (cleared on unmount). Waiting
  requests use no timers; they are checked when the mascot becomes ready or visible.
- Not done: a lower frame-rate cap. `RiveView` supports `frameRate`; add it if profiling shows a need.

## Tests
```
yarn test src/shared/components/Mascot        # gate, RiveMascot behaviour (mocked runtime), still-image fallback, file contract
yarn test src/modules/schedule                # care completion + overdue attention: use case, hub, mapping, store, hooks, CareMascot
yarn test src/modules/pets                    # pet-created event, mapping, hook, PetWelcomeMascot
yarn test src/modules/records                 # record-open tracker, hook, HealthMascot
```
These use a mocked Rive runtime, so they prove the wiring and rules, **not** that the animation plays.

## Device checklist (not yet done)
Run on an iOS simulator/device and an Android device with the real `@rive-app/react-native`:
0. (Needs the Home work, not merged yet.) Home shows the animated companion (not its still image); `onFailed` does not fire. Moods change its face and props
   (`nudge` = bell, `curious` = "?", `proud`, `sleepy` = "Z Z"); a bond level-up plays `celebrate`.
1. (Needs the Care host, not merged yet.) The Care tab shows the animated companion; `onFailed` does not fire.
2. Complete a care task: `success` plays once and returns to the mood. Complete the last task of the day: `celebrate`.
   Have an overdue task: opening the Care tab plays one calm `attention`, and not again on every refresh.
   Add a pet from the pet profile: on returning to the profile the mascot plays one `welcome`.
   Open the health record: the mascot tilts its head once; leave and come back: once more.
3. Tap the mascot repeatedly: one `pet`, not a restart per tap. The face glances toward the touch.
4. Background the app and return; switch tabs and return: animation stops and resumes.
5. Turn on Reduce Motion: the still image appears (and looks the same as the animation's rest pose).
6. Confirm the transparent background and no hitch on a low-end Android.

## Known limits
- The still image cannot play reactions (`react` returns `false`).
- Reactions are not queued: one that is ignored is gone.
- Mood changes during a reaction apply after it ends.
- Cats and dogs look the same: the companion does not follow the pet's species. The `species` prop and the helpers that
  compute it (`useActiveMascotSpecies`, `mascotSpeciesFor`) are now unused by the component and can be removed from
  callers later.
