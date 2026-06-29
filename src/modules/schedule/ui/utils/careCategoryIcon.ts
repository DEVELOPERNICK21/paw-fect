import type { IconName } from '../../../../shared/components/MaterialIcon';
import type { CareCategory } from '../../domain/models/DailyCareBlock';

/** Maps a care category to a Material Icons glyph name. */
export function careCategoryIcon(category: CareCategory): IconName {
  switch (category) {
    case 'feeding':
      return 'restaurant';
    case 'walk':
      return 'directions_walk';
    case 'play':
      return 'pets';
    case 'potty':
      return 'potted_plant';
    case 'grooming':
      return 'content_cut';
    case 'training':
      return 'medical_services';
    case 'health_check':
      return 'monitor_heart';
    case 'litter':
      return 'delete';
    case 'rest':
      return 'dark_mode';
    case 'medication':
      return 'medication';
    case 'bedtime':
      return 'dark_mode';
    default:
      return 'pets';
  }
}
