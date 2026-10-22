import type { PetCreatedEvent } from '../../models/PetCreatedEvent';
import { mascotReactionForPetCreated } from '../petMascotReactions';

describe('mascotReactionForPetCreated', () => {
  it.each(['dog', 'cat'] as const)('welcomes a new %s', petType => {
    const event: PetCreatedEvent = { type: 'pet-created', petId: 'p1', petName: 'Bruno', petType };
    expect(mascotReactionForPetCreated(event)).toBe('welcome');
  });
});
