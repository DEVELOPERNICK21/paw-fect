# The companion in the product: when it appears and what it does

Attachment comes from a character that notices you, answers you, and remembers you, not from one that
is merely on screen. This page is the rulebook for where the companion shows up and which expression it
wears. The animation contract is in [`rive-spec.md`](./rive-spec.md); the component API is in
[`mascot-reactions.md`](./mascot-reactions.md).

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

| Moment | Mood / reaction | Expression | Why |
|---|---|---|---|
| App starting (Splash) | `wave` + greeting reaction | Happy | A face before the first screen |
| Welcome (onboarding) | `wave`, tap ladder | Happy | First contact; it invites a tap ("I like that") |
| Pet basics: typing the name | Looks down at the field, eyes sweep as the name grows | gaze | Naming the pet is the most personal moment: it reads along |
| Pet basics: name entered (step valid) | `success` | Happy | A nod: "got it" |
| First reminder step opens | `welcome` (named pet), mood `curious` | Playful, Curious | "Nice to meet Bruno!" |
| Saving the first reminder | `thinking` loader with rotating lines | Working | Says what it is doing instead of a spinner |
| Saving failed | `nudge` + `attention`, calm copy, Try again | Reminder, Surprised | Never alarmed |
| Paywall | none | - | Deliberately: no pressure |
| Home: first visit of a new day | `welcome`, "Good morning/afternoon/evening" | Playful | Being recognised |
| Home: back after 3+ days | `wave` + `welcome`, "Welcome back" (long absence: "No rush") | Happy, Playful | Warm, never reproachful |
| Home: the pet's birthday | `celebrating` + `celebrate`, "Happy birthday, Bruno! 4 years old" | Excited | The strongest attachment moment |
| Home: something overdue | mood `nudge` | Reminder | A bell, never a scolding |
| Home: something due within a week | mood `curious` | Curious | "X is coming up. I'll remind you." |
| Home: everything for today done | mood `proud` | Encouraging | Closure and praise |
| Home: late at night | mood `sleepy` | Sleepy | It keeps watch |
| Home: bond level up | `celebrating` + `celebrate` | Excited | The relationship grew (beats a greeting) |
| Care: a task is marked done | `success`; the day's last task `celebrate` | Happy, Excited | Reward the action itself |
| Care: a task newly overdue | `attention` | Surprised | Calm, once per task per day |
| Health record opened | `curious` | Thinking | "Let's look at this together" |
| Pet profile created | `welcome` | Playful | Greets the newcomer |
| Empty or error panel | `happy` (empty), `nudge` + `attention` (error) | Idle, Reminder | One clear next step, never a dead end |
| Share moment | `celebrating` | Excited | Pride you can post |

## All 12 expressions, and where each earns its place
| Expression | Mood / reaction | Used for |
|---|---|---|
| Idle | `happy` | Home default, empty states |
| Happy | `wave` | Splash, Welcome, Home return |
| Excited | `celebrating` / `celebrate` | Birthday, level up, day complete, share, six taps |
| Curious | `curious` | Something coming up, first reminder |
| Reminder | `nudge` | Overdue care, errors |
| Working | `thinking` | Loaders |
| Encouraging | `proud` | Today done |
| Sleepy | `sleepy` | Night |
| Caring | `pet` | One tap |
| Playful | `welcome` | Greetings, new pet, three taps |
| Thinking | `curious` (reaction) | Opening a health record, the idle "?" |
| Surprised | `attention` | Overdue care, errors |

## What it remembers (on this device, a few bytes)
`mascotMemoryStore`: when Home was last opened, the day it last greeted, the last birthday year it
celebrated. The first Home visit after onboarding is not greeted (onboarding already said hello); a
visit at night does not use up the day's hello.

## Not done on purpose, or not done yet
- No delay before the paywall to show a celebration: that is a conversion decision, not a mascot one.
- Idle behaviour is the same on every screen; it is not tuned per screen.
- Only Home recognises you today. Care, Health and Pet profile could (their greeting would reuse the same memory).
- The still image (Reduce Motion) cannot do any of the above.
