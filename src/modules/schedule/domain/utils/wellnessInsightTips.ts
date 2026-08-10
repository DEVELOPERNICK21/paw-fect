import type { DailyCareBlock } from '../models/DailyCareBlock';

type PetSpecies = 'dog' | 'cat';

const GROOMING_HEALTH_TIP =
  'A quick look at coat, eyes, and ears can catch lumps or infections early — before a bigger vet bill.';

/**
 * Calendar month 1–12 from an ISO date (YYYY-MM-DD) or Date.
 * Defaults to "now" when omitted so monsoon/heat tips stay season-aware.
 */
export function resolveCalendarMonth(
  asOf: string | Date = new Date(),
): number {
  if (typeof asOf === 'string') {
    const month = Number(asOf.slice(5, 7));
    if (month >= 1 && month <= 12) {
      return month;
    }
  } else if (asOf instanceof Date && !Number.isNaN(asOf.getTime())) {
    return asOf.getMonth() + 1;
  }
  return new Date().getMonth() + 1;
}

function dogWalkSeasonTip(month: number, title: string): string | undefined {
  const isMonsoon = month >= 6 && month <= 9;
  const isSummerHeat = month >= 3 && month <= 5;

  if (isMonsoon) {
    return 'Monsoon (Jun–Sep): skip midday walks when roads are flooded or very humid — early morning or evening is safer.';
  }
  if (isSummerHeat) {
    return 'Summer heat: pavement burns paws. Walk early morning or after sunset, and test the road with your hand first.';
  }
  if (title.includes('morning')) {
    return 'A morning walk helps your dog settle for the day and cuts down restless or anxious behaviour later.';
  }
  if (title.includes('main') || title.includes('exercise') || title.includes('afternoon')) {
    return 'The longer walk burns energy so evenings stay calmer — keep a steady pace and leave sniff time.';
  }
  if (title.includes('evening') || title.includes('night') || title.includes('final')) {
    return 'A short last outing before bed helps them sleep through the night with fewer accidents.';
  }
  return 'Regular walks keep joints moving and give your dog a clear daily routine.';
}

/**
 * Returns a plain-language "Why this matters" tip for a care block.
 * Prefer Indian pet-owner friendly wording; avoid unexplained jargon.
 */
export function resolveInsightTip(
  block: DailyCareBlock,
  species: PetSpecies,
  asOf: string | Date = new Date(),
): string | undefined {
  const title = block.title.toLowerCase();
  const month = resolveCalendarMonth(asOf);

  if (block.category === 'feeding') {
    if (species === 'cat') {
      return 'Measured meals stop overeating and tummy upsets. Fresh water every time matters in Indian heat.';
    }
    return 'Waiting a bit after a walk before feeding lowers the risk of vomiting or bloat. Keep portions measured.';
  }

  if (block.category === 'walk' && species === 'dog') {
    return dogWalkSeasonTip(month, title);
  }

  if (block.category === 'potty') {
    if (title.includes('post-meal') || title.includes('after meal')) {
      return 'Most dogs need to pee or poop 15–30 minutes after eating — a short break prevents indoor accidents.';
    }
    if (title.includes('evening')) {
      return 'A calm evening potty walk after dinner helps digestion and avoids overnight accidents.';
    }
    if (title.includes('night') || title.includes('final') || title.includes('last')) {
      return 'One last potty before lights out means fewer middle-of-the-night wake-ups.';
    }
    return 'Regular potty breaks protect flooring and keep your pet comfortable between walks.';
  }

  if (block.category === 'play') {
    if (species === 'cat') {
      return 'Cats like to "hunt" before they eat. Short play first usually means calmer feeding and less food-guarding.';
    }
    return 'Short play or puzzle time burns leftover energy and keeps boredom chewing down.';
  }

  if (block.category === 'litter') {
    return 'Cats often refuse a dirty litter box — scooping once per visit prevents messes outside the box.';
  }

  if (block.category === 'training' && block.isFreeFeature) {
    return 'Five quiet minutes of commands with meal kibble builds manners without needing extra treats.';
  }

  if (block.category === 'bedtime' || block.category === 'rest') {
    if (title.includes('wind-down') || title.includes('rest')) {
      return 'Quiet wind-down (no rough play) helps pets sleep through the night on a steady schedule.';
    }
    return 'A calm bedtime routine helps your pet sleep better and wake less at night.';
  }

  if (
    block.category === 'grooming' ||
    block.category === 'health_check' ||
    title.includes('health check')
  ) {
    return GROOMING_HEALTH_TIP;
  }

  return undefined;
}
