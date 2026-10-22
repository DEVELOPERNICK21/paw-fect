import React from 'react';
import { act, create } from 'react-test-renderer';

import type { PetCreatedEvent } from '../../../../domain/models/PetCreatedEvent';
import { PetWelcomeMascot } from '../PetWelcomeMascot';

type Listener = (event: PetCreatedEvent) => void;
const mockListeners = new Set<Listener>();
const mockFocus = { value: true };
let mockMascotProps: Record<string, unknown> = {};

jest.mock('../../../../store/petStore', () => ({
  subscribeToPetCreated: (listener: Listener) => {
    mockListeners.add(listener);
    return () => mockListeners.delete(listener);
  },
}));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocus.value }));
jest.mock('../../../../../../shared/components/Mascot', () => ({
  Mascot: (props: Record<string, unknown>) => {
    mockMascotProps = props;
    return null;
  },
}));

beforeEach(() => {
  mockListeners.clear();
  mockFocus.value = true;
  mockMascotProps = {};
});

describe('PetWelcomeMascot', () => {
  it('shows an interactive mascot for the pet species with nothing to play yet', () => {
    act(() => {
      create(<PetWelcomeMascot species="cat" />);
    });
    expect(mockMascotProps.species).toBe('cat');
    expect(mockMascotProps.interactive).toBe(true);
    expect(mockMascotProps.reactionRequest).toBeNull();
  });

  it('hands the mascot a welcome request when a pet is created, even while unfocused', () => {
    mockFocus.value = false;
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<PetWelcomeMascot species="dog" />);
    });
    act(() => {
      mockListeners.forEach(l => l({ type: 'pet-created', petId: 'p9', petName: 'Mo', petType: 'dog' }));
    });
    expect(mockMascotProps.reactionRequest).toEqual({ reaction: 'welcome', id: 'pet-created:p9' });
    // not focused: the mascot is told to hold the request, which it plays once visible
    expect(mockMascotProps.paused).toBe(true);
    mockFocus.value = true;
    act(() => tree.update(<PetWelcomeMascot species="dog" />));
    expect(mockMascotProps.paused).toBe(false);
    expect(mockMascotProps.reactionRequest).toEqual({ reaction: 'welcome', id: 'pet-created:p9' });
  });
});
