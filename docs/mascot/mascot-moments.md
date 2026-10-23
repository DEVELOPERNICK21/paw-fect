# The companion in the product: when it appears and what it does

Attachment comes from a character that notices you, answers you, and remembers you, not from one that
is merely on screen. This page is the rulebook for where the companion shows up and which expression it
wears. The animation contract is in [`rive-spec.md`](./rive-spec.md); the component API is in
[`mascot-reactions.md`](./mascot-reactions.md).

**Status labels.** *main* means committed and pushed to `origin/main`. *pending* means the code is written in the
working tree (by another session) but not committed, so it is not on main yet. Nothing on this page has been seen in
the signed-in app; see [Verification status](#verification-status).

## Rules (these decide every case)
1. **React to what the user did, or is about to do.** Never decoration. Every appearance says or does
   something specific to the moment (the voice lives in `companionVoice.ts` and `companionGreeting.ts`).
2. **Restraint.** One greeting a day, never at night, never twice. At most one unprompted reaction a minute.
   Nothing replays on a re-render. Nothing blocks the screen, and everything can be ignored.
3. **Never guilt.** There is no sad or angry expression. Overdue care gets `nudge` (a bell) and `attention`
   (a calm "!"), a long absence gets "welcome back", never "where were you". Copy is tested for guilt words.
4. **Be reciprocal.** It looks where you touch, answers repeated taps, reads along as you type, greets you by
   name, and remembers the pet's birthday.
5. **Be honest about money.** No mascot on the paywall, no urgency, no streak-loss shaming.

## How it responds to touch and to being left alone
Applies to every interactive mascot (`interactive` or `onPress`); a decorative one stays still.

| You do | It does | Expression |
|---|---|---|
| Touch or drag over it | Eyes follow your finger from touch-down, and stay a moment after you let go | gaze |
| 1 tap | Closed happy eyes and a heart | Caring (`pet`) |
| 3 quick taps (each within 2.5 s) | Sparkles and a happy hop | Playful (`welcome`) |
| 6 quick taps | An excited cheer. Then 6 s cooldown, so the big one cannot be spammed | Excited (`celebrate`) |
| Nothing for 10-15 s | Glances around (never the same way twice) | gaze |
| Still nothing, about a minute | A curious "?" (the cycle is 3 glances then one "?", so never faster than once a minute) | Thinking (`curious`) |

It does not fidget while asleep (`sleepy`), busy (`thinking`), celebrating, or nudging about something that
needs attention. Not while the screen is hidden, the app is in the background, or Reduce Motion is on (the still
image has no motion). Timers exist only while it is loaded, visible and calm, and are cleared on unmount.

A screen can direct its gaze: `ref.look(x, y, holdMs)` (`x` right, `y` down, -1..1).

## Where it appears, and what it does there

| Moment | Mood / reaction | Expression | Why | Status |
|---|---|---|---|---|
| App starting (Splash) | `wave` + greeting reaction | Happy | A face before the first screen | pending |
| Welcome (onboarding) | `wave`, tap ladder | Happy | First contact; it invites a tap ("I like that") | pending |
| Pet basics: typing the name | Looks down at the field, eyes sweep as the name grows | gaze | Naming the pet is the most personal moment: it reads along | pending |
| Pet basics: name entered (step valid) | `success` | Happy | A nod: "got it" | pending |
| First reminder step opens | `welcome` (named pet), mood `curious` | Playful, Curious | "Nice to meet Bruno!" | pending |
| Saving the first reminder | `thinking` loader with rotating lines | Working | Says what it is doing instead of a spinner | pending |
| Saving failed | `nudge` + `attention`, calm copy, Try again | Reminder, Surprised | Never alarmed | pending |
| Paywall | none | - | Deliberately: no pressure | by design |
| Home: first visit of a new day | `welcome`, "Good morning/afternoon/evening" | Playful | Being recognised | main |
| Home: back after 3+ days | `wave` + `welcome`, "Welcome back" (long absence: "No rush") | Happy, Playful | Warm, never reproachful | main |
| Home: the pet's birthday | `celebrating` + `celebrate`, "Happy birthday, Bruno! 4 years old" | Excited | The strongest attachment moment | main |
| Home: no pet yet | `wave` | Happy | An invitation to add one | main |
| Home: something overdue | mood `nudge` | Reminder | A bell, never a scolding | main |
| Home: something due within a week | mood `curious` | Curious | "X is coming up. I'll remind you." | main |
| Home: everything for today done | mood `proud` | Encouraging | Closure and praise | main |
| Home: late at night | mood `sleepy`, only when nothing above applies (see [How Home picks its mood](#how-home-picks-its-mood)) | Sleepy | It keeps watch | main |
| Home: bond level up | `celebrating` + `celebrate` | Excited | The relationship grew (beats a greeting) | main |
| Home: the walk reaches its treat | `proud` + `celebrate` (otherwise `happy`) | Encouraging, Excited | Progress made visible | main |
| Care: mood follows today's care | `nudge` if overdue, `proud` if all done, else `happy` | Reminder, Encouraging, Idle | The tab always reads the day correctly | main |
| Care: a task is marked done | `success`; the day's last task `celebrate` | Happy, Excited | Reward the action itself | main |
| Care: a task newly overdue | `attention` | Surprised | Calm, once per task per day | main |
| Care-done toast | `happy`, `celebrating` for the day's last task | Idle, Excited | Same reward in the toast | main (streak-milestone lines pending) |
| Health: mood follows the summary | `nudge` needs attention, `curious` something soon, `proud` on track, `thinking` no records yet | Reminder, Curious, Encouraging, Working | One friendly sentence about the plan | main |
| Health record opened | `curious` | Thinking | "Let's look at this together" | main |
| Pet profile created | `welcome` | Playful | Greets the newcomer | main |
| Share moment | `celebrating` | Excited | Pride you can post | main |
| Empty or error panel | `happy` (empty), `nudge` + `attention` (error) | Idle, Reminder | One clear next step, never a dead end | pending |

**Onboarding is the biggest gap.** On main the live onboarding flow is Welcome, Activate, Persist, Paywall
(`OnboardingNavigator`), and none of those screens mounts the companion. `OnboardingCompanion` exists and is tested, but
on main only the older funnel screen (`OnboardingFunnelScreen`) mounts it, and that screen is not in the navigator, so no
onboarding moment above is live yet. They go live when the pending changes to the Activation, Welcome and Persist screens are committed.

## How Home picks its mood
The first rule that matches wins (`mascotMoodForHome`):
1. No pet yet: `wave`.
2. Something overdue: `nudge`.
3. A milestone due within 7 days: `curious`.
4. Every task for today done: `proud`.
5. Between 21:00 and 06:00: `sleepy`.
6. Otherwise: `happy`.

Sleepy is rule 5, so it only shows when nothing above applies: nothing overdue, nothing due within a week, and today
not already finished. That is deliberate ("night with nothing pending"), but it means a user with a vaccine due next
week sees `curious` at 11 pm, not `sleepy`. A birthday or welcome-back greeting overrides the mood for 9 seconds
(`celebrating` or `wave`). The Care tab uses a shorter version: `nudge` if a task is overdue, `proud` if all is well,
else `happy`.

## All 12 expressions, and where each earns its place
Every expression has at least one use on main. Uses marked *(pending)* are not on main yet.

| Expression | Mood / reaction | Used for |
|---|---|---|
| Idle | `happy` | Home and Care default, the new pet profile, the walk; empty panels *(pending)* |
| Happy | `wave` | Home with no pet, welcome-back; Splash and Welcome *(pending)* |
| Excited | `celebrating` / `celebrate` | Birthday, level up, day complete, share, six taps |
| Curious | `curious` | Something due within a week, Health "coming soon"; first reminder step *(pending)* |
| Reminder | `nudge` | Overdue care on Home, Care and Health; error panels *(pending)* |
| Working | `thinking` | Health with no records yet; loaders and the saving step *(pending)* |
| Encouraging | `proud` | Today done on Home and Care, Health on track, the walk's end |
| Sleepy | `sleepy` | Home at night when nothing else applies; the empty notification inbox *(pending)* |
| Caring | `pet` | One tap |
| Playful | `welcome` | Home daily hello and welcome-back, new pet, three taps; Splash and onboarding *(pending)* |
| Thinking | `curious` (reaction) | Opening a health record, the idle "?" |
| Surprised | `attention` | A care task newly overdue; error panels *(pending)* |

## What it remembers (on this device, a few bytes)
`mascotMemoryStore`: when Home was last opened, the day it last greeted, the last birthday year it
celebrated. The first Home visit after onboarding is not greeted (onboarding already said hello); a
visit at night does not use up the day's hello.

## Not done on purpose, or not done yet
- No delay before the paywall to show a celebration: that is a conversion decision, not a mascot one.
- Idle behaviour is the same on every screen; it is not tuned per screen.
- Only Home recognises you today. Care, Health and Pet profile could (their greeting would reuse the same memory).
- The still image (Reduce Motion) cannot do any of the above.

## Verification status
- **Tested in code:** the mood rules (`mascotMood`, `careMascotMood`, the Health tone map), the greeting and memory
  rules, the tap ladder, idle life, the touch gaze, and the host components. The tests pin the rules with literal values.
- **Seen on the iOS simulator** (a build of the working tree, onboarding screen): the eyes following a finger, one tap
  giving the heart, three taps the sparkles, six taps the cheer. Rive's web player also plays all 12 faces from the shipped file.
- **Not seen yet:** Home, Care, Health and the pet profile in the signed-in app, so none of their moods, reactions or
  greetings has been watched on a device or simulator. Also not seen: Android, a physical device, Reduce Motion.
