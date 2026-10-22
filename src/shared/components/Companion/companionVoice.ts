/**
 * The companion's voice. One calm, warm character that speaks in first person,
 * keeps it short, never scolds and never uses guilt. Every appearance on screen
 * says something specific to what the user is doing (that is what makes it a
 * character rather than decoration).
 *
 * Pure: primitives in, strings out. The first line is the primary one; the rest
 * are alternates that a tap cycles through.
 */
export type CompanionHomeMood =
  | 'wave'
  | 'nudge'
  | 'curious'
  | 'proud'
  | 'sleepy'
  | 'happy'
  | 'thinking'
  | 'celebrating';

export type CompanionScene =
  | {
      scene: 'home';
      mood: CompanionHomeMood;
      petName: string;
      overdueCount: number;
      /** Next scheduled item, e.g. "Rabies booster". */
      nextLabel?: string;
      nextDays?: number;
      hour: number;
    }
  | {
      scene: 'care';
      petName?: string;
      allGood: boolean;
      overdueCount: number;
      remaining: number;
    }
  | {
      scene: 'health';
      petName: string;
      tone: 'attention' | 'soon' | 'ontrack' | 'empty';
      overdueCount: number;
      nextLabel?: string;
      nextDays?: number;
    }
  | { scene: 'welcome'; petName: string }
  | { scene: 'onboarding'; step: CompanionOnboardingStep; petName?: string }
  | { scene: 'celebrate'; kind: 'task' | 'day'; petName: string }
  | { scene: 'levelup'; level: number; title: string; petName: string }
  | { scene: 'walk'; petName: string; done: number; total: number; streakDays: number };

export type CompanionOnboardingStep =
  | 'trustOpen'
  | 'problemNaming'
  | 'petBasics'
  | 'goal'
  | 'careFocus'
  | 'planReveal'
  | 'commitment';

export function whenPhrase(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  if (hour >= 18 && hour < 22) return 'Good evening';
  return 'Hello';
}

export function companionLines(ctx: CompanionScene): string[] {
  switch (ctx.scene) {
    case 'home': {
      const { petName: pet } = ctx;
      switch (ctx.mood) {
        case 'wave':
          return [
            "Hi! I'm your pet's buddy. Add your pet and I'll keep track of every dose.",
            'Tell me their birthday and I will build the plan.',
          ];
        case 'nudge':
          return [
            // No count here: Home's banner counts a wider set of items and two
            // different numbers on one screen would confuse.
            `A few things need a look for ${pet}. We'll sort it together, one tap at a time.`,
            `No stress. Start with the first one and I'll cheer you on.`,
          ];
        case 'curious': {
          const when =
            ctx.nextDays != null ? ` ${whenPhrase(ctx.nextDays)}` : ' soon';
          return [
            `${ctx.nextLabel ?? 'Something'} is coming up${when}. I'll remind you.`,
            `${pet} is all set until then.`,
          ];
        }
        case 'proud':
          return [
            `Everything for today is done. ${pet} is lucky to have you!`,
            `That is how it's done. Go give ${pet} a cuddle.`,
          ];
        case 'sleepy':
          return [
            `Shh... ${pet} is resting. I'll keep watch tonight.`,
            `Sleep tight, ${pet}. See you tomorrow.`,
          ];
        default:
          return [
            `${greeting(ctx.hour)}! What's on the plan for ${pet} today?`,
            `I'm here if you need me. Tap the paw to say hi.`,
          ];
      }
    }
    case 'care': {
      const who = ctx.petName ?? 'your pets';
      if (ctx.overdueCount > 0) {
        return [
          `A few things are waiting for ${who}. Start with the top one.`,
          `You've got this. I'll be right here.`,
        ];
      }
      if (ctx.allGood || ctx.remaining === 0) {
        return [
          `All done for today! ${ctx.petName ?? 'They'} thank${ctx.petName ? 's' : ''} you.`,
          `Nothing left. Time to relax together.`,
        ];
      }
      return [
        `${ctx.remaining} to go today. You've got this.`,
        `Tap "Done" when each one is finished. I'll celebrate with you.`,
      ];
    }
    case 'health': {
      const { petName: pet } = ctx;
      switch (ctx.tone) {
        case 'attention':
          return [
            // The summary card right below already states the count.
            `Let's get ${pet} back on track. Tap "I did this" as you finish each one.`,
            `Your vet decides what is right for ${pet}. I just help you remember.`,
          ];
        case 'soon': {
          const when =
            ctx.nextDays != null ? ` ${whenPhrase(ctx.nextDays)}` : ' soon';
          return [
            `${ctx.nextLabel ?? 'The next item'} is due${when}. I'll nudge you before then.`,
            `${pet} is covered for now.`,
          ];
        }
        case 'ontrack':
          return [
            `${pet} is on track. Lovely work!`,
            `Nothing due soon. I'll tell you when that changes.`,
          ];
        default:
          return [
            `I'm getting ${pet}'s plan ready.`,
            `It appears here once the schedule is set up.`,
          ];
      }
    }
    case 'onboarding': {
      const pet = ctx.petName?.trim() ? ctx.petName.trim() : 'your pet';
      switch (ctx.step) {
        case 'trustOpen':
          return [
            "Hi! I'm your pet's buddy. Two minutes and I'll build a care plan for your pet.",
            `I'll remember every date so you don't have to.`,
          ];
        case 'problemNaming':
          return [
            `What's hardest about keeping up with ${pet}'s care? Pick all that fit. No wrong answers.`,
            `Most people forget dates. You're in good company.`,
          ];
        case 'petBasics':
          return [
            `Tell me about ${pet}. A name and a birthday is all I need to start.`,
            `The birthday lets me time vaccines and deworming for their age.`,
          ];
        case 'goal':
          return [
            `What matters most for ${pet}? I'll shape the plan around it.`,
            `You can change this any time.`,
          ];
        case 'careFocus':
          return [
            `What should I keep an eye on for ${pet}?`,
            `Pick as many as you like.`,
          ];
        case 'planReveal':
          return [
            `${pet}'s plan is ready! Here's what I'll keep on track.`,
            `Your vet decides the details. I just help you remember.`,
          ];
        default:
          return [
            `Ready when you are. I'll remind you before every date.`,
            `Free to start. No credit card.`,
          ];
      }
    }
    case 'levelup':
      return [
        `Level ${ctx.level}! We're officially ${ctx.title}s. ${ctx.petName} is proud of you.`,
        `Look how far we've come together.`,
      ];
    case 'walk': {
      if (ctx.total <= 0) {
        return [`Nothing planned today. A cuddle counts, though.`];
      }
      if (ctx.done >= ctx.total) {
        return [
          `We made it! Treat time for ${ctx.petName}.`,
          ctx.streakDays > 1
            ? `${ctx.streakDays} days in a row. Wow.`
            : `Day one of a great streak.`,
        ];
      }
      if (ctx.done === 0) {
        return [
          `Let's go for today's walk. First stop whenever you're ready.`,
          `Each task gets us closer to the treat.`,
        ];
      }
      const left = ctx.total - ctx.done;
      return [
        `${left} ${left === 1 ? 'stop' : 'stops'} to go. We're on our way!`,
        `Keep walking. ${ctx.petName} is cheering.`,
      ];
    }
    case 'celebrate':
      if (ctx.kind === 'day') {
        return [
          `That's a wrap! ${ctx.petName}'s whole day is done.`,
          `You two make a great team.`,
        ];
      }
      return [
        `Nice one! ${ctx.petName} is in good hands.`,
        `One down. I'm proud of you.`,
      ];
    case 'welcome':
      return [
        `Welcome, ${ctx.petName}! I'll help keep ${ctx.petName} healthy.`,
        `Let's make every checkup count.`,
      ];
  }
}
