import type { CareCategory, DailyCareBlock } from '../models/DailyCareBlock';

/**
 * Clear action label for care tasks (e.g. "Feed Bruno").
 */
export function careTaskActionLabel(
  block: Pick<DailyCareBlock, 'category' | 'title'>,
  petName: string,
): string {
  const name = petName.trim() || 'your pet';
  switch (block.category as CareCategory) {
    case 'feeding':
      return `Feed ${name}`;
    case 'walk':
      return `Walk ${name}`;
    case 'play':
      return `Play with ${name}`;
    case 'potty':
      return `Potty break · ${name}`;
    case 'grooming':
      return `Groom ${name}`;
    case 'training':
      return `Train ${name}`;
    case 'health_check':
      return `Check on ${name}`;
    case 'litter':
      return 'Scoop litter';
    case 'rest':
      return `Rest · ${name}`;
    case 'medication':
      return 'Give medicine';
    case 'bedtime':
      return `Bedtime · ${name}`;
    default:
      return block.title;
  }
}

/** Short verb for compact rows. */
export function careTaskShortVerb(
  block: Pick<DailyCareBlock, 'category' | 'title'>,
): string {
  switch (block.category as CareCategory) {
    case 'feeding':
      return 'Feed';
    case 'walk':
      return 'Walk';
    case 'play':
      return 'Play';
    case 'potty':
      return 'Potty';
    case 'grooming':
      return 'Groom';
    case 'training':
      return 'Train';
    case 'health_check':
      return 'Check';
    case 'litter':
      return 'Litter';
    case 'rest':
      return 'Rest';
    case 'medication':
      return 'Medicine';
    case 'bedtime':
      return 'Bedtime';
    default:
      return block.title.split(' ')[0] || block.title;
  }
}

/** Supporting detail under the action title. */
export function careTaskSubtitle(
  block: Pick<DailyCareBlock, 'title' | 'category'>,
): string {
  return block.title;
}
