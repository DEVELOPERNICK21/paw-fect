import type { Pet } from '../../models/Pet';
import type { PetCreatedEvent } from '../../models/PetCreatedEvent';
import type { PetCreatedEventPort } from '../../ports/PetCreatedEventPort';
import type { PetRepository } from '../../repositories/PetRepository';
import { CreatePet } from '../CreatePet';

const pet = (over: Partial<Pet> = {}): Pet => ({
  id: 'p1',
  userId: 'u1',
  name: 'Bruno',
  type: 'dog',
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  ...over,
});

const repoReturning = (result: Promise<Pet>): PetRepository =>
  ({ createPet: jest.fn(() => result) }) as unknown as PetRepository;

function recorder(): { port: PetCreatedEventPort; events: PetCreatedEvent[] } {
  const events: PetCreatedEvent[] = [];
  return { events, port: { subscribe: jest.fn(), emit: e => events.push(e) } };
}

describe('CreatePet announces real creations', () => {
  it('emits after the repository accepted the pet, using what it returned', async () => {
    const { port, events } = recorder();
    const saved = pet({ id: 'server-id', name: 'Bruno Jr', type: 'cat' });
    const result = await new CreatePet(repoReturning(Promise.resolve(saved)), port).execute('u1', pet());
    expect(result).toBe(saved);
    expect(events).toEqual([{ type: 'pet-created', petId: 'server-id', petName: 'Bruno Jr', petType: 'cat' }]);
  });

  it('emits nothing, and still rejects, when the repository fails', async () => {
    const { port, events } = recorder();
    await expect(
      new CreatePet(repoReturning(Promise.reject(new Error('offline'))), port).execute('u1', pet()),
    ).rejects.toThrow('offline');
    expect(events).toHaveLength(0);
  });

  it('emits only after saving, never before', async () => {
    const order: string[] = [];
    const repo = {
      createPet: jest.fn(async () => {
        order.push('saved');
        return pet();
      }),
    } as unknown as PetRepository;
    const port: PetCreatedEventPort = { subscribe: jest.fn(), emit: () => order.push('announced') };
    await new CreatePet(repo, port).execute('u1', pet());
    expect(order).toEqual(['saved', 'announced']);
  });

  it('still works without an event port', async () => {
    const saved = pet();
    await expect(new CreatePet(repoReturning(Promise.resolve(saved))).execute('u1', pet())).resolves.toBe(saved);
  });
});
