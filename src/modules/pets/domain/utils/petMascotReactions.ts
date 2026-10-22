import type { MascotReaction } from '../../../../shared/components/Mascot/mascotTypes';
import type { PetCreatedEvent } from '../models/PetCreatedEvent';

/**
 * Which mascot reaction a newly created pet deserves. Pure: no React, no animation code.
 */
export function mascotReactionForPetCreated(
  _event: PetCreatedEvent,
): MascotReaction {
  return 'welcome';
}
