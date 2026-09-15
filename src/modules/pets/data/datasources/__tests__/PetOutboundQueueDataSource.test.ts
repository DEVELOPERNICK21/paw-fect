import { storageService } from '../../../../../infrastructure/storage/storageService';
import {
  createPetOutboundQueueDataSource,
  type PetQueueEntry,
} from '../PetOutboundQueueDataSource';

jest.mock('../../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockGetItem = storageService.getItem as jest.Mock;
const mockSetItem = storageService.setItem as jest.Mock;

describe('PetOutboundQueueDataSource.removeEntriesForPet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes create/update/delete entries for the pet and keeps others', async () => {
    const existing: PetQueueEntry[] = [
      { id: 'pq1', op: 'update', pet: { id: 'keep-me' } as PetQueueEntry['pet'] },
      { id: 'pq2', op: 'create', pet: { id: 'delete-me' } as PetQueueEntry['pet'] },
      { id: 'pq3', op: 'delete', petId: 'delete-me' },
      { id: 'pq4', op: 'update', pet: { id: 'delete-me' } as PetQueueEntry['pet'] },
    ];
    mockGetItem.mockResolvedValue(existing);

    const queue = createPetOutboundQueueDataSource();
    await queue.removeEntriesForPet('user-1', 'delete-me');

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const saved = mockSetItem.mock.calls[0]?.[1] as PetQueueEntry[];
    expect(saved).toHaveLength(1);
    expect(saved[0]?.id).toBe('pq1');
    expect(saved[0]?.pet?.id).toBe('keep-me');
  });
});
