import type { Pet } from '../../models/Pet';
import { mergeLocalAndRemotePets } from '../mergeLocalAndRemotePets';

const basePet = (overrides: Partial<Pet> & Pick<Pet, 'id'>): Pet => ({
  id: overrides.id,
  userId: 'user-1',
  name: overrides.name ?? 'Buddy',
  type: overrides.type ?? 'dog',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  photo: overrides.photo,
  syncStatus: overrides.syncStatus,
  breed: overrides.breed,
});

describe('mergeLocalAndRemotePets', () => {
  it('prefers remote photo when local is stuck pending with no outbound queue', () => {
    const local = basePet({
      id: 'pet-1',
      photo: 'data:image/jpeg;base64,OLD',
      syncStatus: 'pending',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const remote = basePet({
      id: 'pet-1',
      photo: 'data:image/jpeg;base64,NEW',
      updatedAt: '2026-08-12T00:00:00.000Z',
    });

    const merged = mergeLocalAndRemotePets({
      localPets: [local],
      remotePets: [remote],
      queueEntries: [],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.photo).toBe('data:image/jpeg;base64,NEW');
    expect(merged[0]?.syncStatus).toBe('synced');
  });

  it('keeps local photo when an outbound update is still queued', () => {
    const local = basePet({
      id: 'pet-1',
      photo: 'data:image/jpeg;base64,LOCAL',
      syncStatus: 'pending',
    });
    const remote = basePet({
      id: 'pet-1',
      photo: 'data:image/jpeg;base64,REMOTE',
    });

    const merged = mergeLocalAndRemotePets({
      localPets: [local],
      remotePets: [remote],
      queueEntries: [{ op: 'update', pet: { id: 'pet-1' } }],
    });

    expect(merged[0]?.photo).toBe('data:image/jpeg;base64,LOCAL');
  });

  it('does not resurrect pets that are queued for delete', () => {
    const remote = basePet({ id: 'pet-1', photo: 'data:image/jpeg;base64,X' });

    const merged = mergeLocalAndRemotePets({
      localPets: [],
      remotePets: [remote],
      queueEntries: [{ op: 'delete', petId: 'pet-1' }],
    });

    expect(merged).toHaveLength(0);
  });
});
