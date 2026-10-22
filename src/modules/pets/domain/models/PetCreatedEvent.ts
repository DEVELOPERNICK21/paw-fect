import type { PetType } from './Pet';

/**
 * Emitted once a pet profile has genuinely been created: the repository accepted it.
 * Never emitted for a failed save, an edit, or a pet that was only loaded.
 */
export interface PetCreatedEvent {
  type: 'pet-created';
  petId: string;
  petName: string;
  petType: PetType;
}
