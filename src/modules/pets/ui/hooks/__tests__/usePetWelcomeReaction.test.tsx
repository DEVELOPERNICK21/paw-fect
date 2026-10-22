import React from 'react';
import { act, create } from 'react-test-renderer';

import type { MascotReactionRequest } from '../../../../../shared/components/Mascot';
import type { PetCreatedEvent } from '../../../domain/models/PetCreatedEvent';
import { usePetWelcomeReaction } from '../usePetWelcomeReaction';

type Listener = (event: PetCreatedEvent) => void;
const mockListeners = new Set<Listener>();

jest.mock('../../../store/petStore', () => ({
  subscribeToPetCreated: (listener: Listener) => {
    mockListeners.add(listener);
    return () => mockListeners.delete(listener);
  },
}));

const emit = (petId = 'p1'): void => {
  const event: PetCreatedEvent = { type: 'pet-created', petId, petName: 'Bruno', petType: 'dog' };
  mockListeners.forEach(l => l(event));
};

let latest: MascotReactionRequest | null = null;
const Host: React.FC = () => {
  latest = usePetWelcomeReaction();
  return null;
};

beforeEach(() => {
  mockListeners.clear();
  latest = null;
});

describe('usePetWelcomeReaction', () => {
  it('asks for nothing until a pet is created', () => {
    act(() => {
      create(<Host />);
    });
    expect(latest).toBeNull();
  });

  it('asks for a welcome, keyed by the pet', () => {
    act(() => {
      create(<Host />);
    });
    act(() => emit('p1'));
    expect(latest).toEqual({ reaction: 'welcome', id: 'pet-created:p1' });
  });

  it('a different pet gets its own welcome', () => {
    act(() => {
      create(<Host />);
    });
    act(() => emit('p1'));
    act(() => emit('p2'));
    expect(latest?.id).toBe('pet-created:p2');
  });

  it('the same pet announced twice keeps the same id, so it is welcomed once', () => {
    act(() => {
      create(<Host />);
    });
    act(() => emit('p1'));
    const first = latest?.id;
    act(() => emit('p1'));
    expect(latest?.id).toBe(first);
  });

  it('unsubscribes on unmount', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host />);
    });
    expect(mockListeners.size).toBe(1);
    act(() => tree.unmount());
    expect(mockListeners.size).toBe(0);
  });
});
