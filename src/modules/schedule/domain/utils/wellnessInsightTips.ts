import type { DailyCareBlock } from '../models/DailyCareBlock';

type PetSpecies = 'dog' | 'cat';

const GROOMING_HEALTH_TIP =
  'Early detection of lumps, skin issues, or eye discharge saves vet bills and catches illness early.';

/**
 * Returns a vet-backed insight tip for a care block, matched by species, category, and title.
 */
export function resolveInsightTip(
  block: DailyCareBlock,
  species: PetSpecies,
): string | undefined {
  const title = block.title.toLowerCase();

  if (species === 'dog') {
    if (block.category === 'walk' && title.includes('morning')) {
      return "Morning walks set your dog's circadian rhythm and reduce anxious behaviour through the day.";
    }
    if (
      block.category === 'potty' &&
      title.includes('post-meal')
    ) {
      return 'Dogs have a gastrocolic reflex — they need to eliminate 15–30 min after eating to avoid indoor accidents.';
    }
  }

  if (species === 'cat') {
    if (block.category === 'play' && title.includes('hunt')) {
      return 'Cats instinctively hunt before eating. Play first = calmer feeding and less food aggression.';
    }
    if (block.category === 'litter') {
      return 'Cats refuse to use a dirty litter box — one scoop per visit prevents litter box avoidance.';
    }
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
