import type { Pet } from '../../models/Pet';

export type PetOutboundQueueHint = {
  op: 'create' | 'update' | 'delete';
  petId?: string;
  pet?: Pick<Pet, 'id'>;
};

/**
 * Merges local + remote pets for offline-first sync.
 *
 * Prefer remote for an id unless there is a real outbound create/update still
 * queued for that pet. Stale local `syncStatus: 'pending'` alone must not block
 * remote photo/profile updates from other devices.
 */
export function mergeLocalAndRemotePets(input: {
  localPets: Pet[];
  remotePets: Pet[];
  queueEntries: PetOutboundQueueHint[];
}): Pet[] {
  const { localPets, remotePets, queueEntries } = input;

  const pendingDeletePetIds = new Set(
    queueEntries
      .filter(e => e.op === 'delete' && typeof e.petId === 'string')
      .map(e => e.petId as string),
  );

  const queuedWritePetIds = new Set(
    queueEntries.flatMap(e => {
      if (e.op === 'create' || e.op === 'update') {
        const id = e.pet?.id ?? e.petId;
        return typeof id === 'string' && id.length > 0 ? [id] : [];
      }
      return [];
    }),
  );

  const mergedMap = new Map<string, Pet>();

  for (const localPet of localPets) {
    if (queuedWritePetIds.has(localPet.id)) {
      mergedMap.set(localPet.id, localPet);
    }
  }

  for (const remotePet of remotePets) {
    if (queuedWritePetIds.has(remotePet.id)) {
      continue;
    }
    if (pendingDeletePetIds.has(remotePet.id)) {
      continue;
    }
    mergedMap.set(remotePet.id, {
      ...remotePet,
      syncStatus: 'synced',
    });
  }

  for (const localPet of localPets) {
    if (!mergedMap.has(localPet.id)) {
      mergedMap.set(localPet.id, localPet);
    }
  }

  return Array.from(mergedMap.values());
}
