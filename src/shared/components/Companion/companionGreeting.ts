/**
 * What the companion says when you open the app. Same voice as `companionVoice`: warm, short,
 * first person, never guilt ("it has been N days" is never said as a reproach).
 *
 * Pure: primitives in, strings out. The first line is the primary one.
 */
export type GreetingKind = 'daily' | 'welcomeBack' | 'birthday';

export interface GreetingContext {
  petName: string;
  /** Local hour, 0-23. */
  hour: number;
  /** Whole days since the app was last opened (welcome back). */
  daysAway?: number;
  /** The pet's age in whole years today (birthday). */
  age?: number;
}

function ageText(age: number | undefined): string {
  if (age == null || age < 1) {
    return 'a year older';
  }
  return age === 1 ? '1 year old' : `${age} years old`;
}

export function greetingLines(kind: GreetingKind, ctx: GreetingContext): string[] {
  const pet = ctx.petName.trim() || 'your pet';
  switch (kind) {
    case 'birthday':
      return [
        `Happy birthday, ${pet}! ${ageText(ctx.age)} today!`,
        `I'm so glad I get to look after you.`,
      ];
    case 'welcomeBack': {
      if ((ctx.daysAway ?? 0) >= 7) {
        return [
          `You're back! I kept ${pet}'s dates safe while you were away.`,
          `No rush. Let's see what ${pet} needs today.`,
        ];
      }
      return [`Welcome back! I missed you and ${pet}.`, `Let's see what's coming up.`];
    }
    default: {
      if (ctx.hour >= 5 && ctx.hour < 12) {
        return [`Good morning! Ready for a day with ${pet}?`, `Let's see what's on the plan.`];
      }
      if (ctx.hour >= 12 && ctx.hour < 18) {
        return [`Good afternoon! How is ${pet} doing?`, `I'm here if you need me.`];
      }
      return [`Good evening! A calm end to the day for you and ${pet}.`, `I'll keep watch tonight.`];
    }
  }
}
