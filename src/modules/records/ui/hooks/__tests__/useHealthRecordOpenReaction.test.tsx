import React from 'react';
import { act, create } from 'react-test-renderer';

import type { MascotReactionRequest } from '../../../../../shared/components/Mascot';
import { useHealthRecordOpenReaction } from '../useHealthRecordOpenReaction';

const mockFocus = { value: true };
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocus.value }));

let latest: MascotReactionRequest | null = null;
const Host: React.FC<{ petId: string | null }> = ({ petId }) => {
  latest = useHealthRecordOpenReaction(petId);
  return null;
};

beforeEach(() => {
  mockFocus.value = true;
  latest = null;
});

describe('useHealthRecordOpenReaction', () => {
  it('asks for a curious tilt when the screen opens with a pet', () => {
    act(() => {
      create(<Host petId="p1" />);
    });
    expect(latest).toEqual({ reaction: 'curious', id: 'health-record-open:p1:1' });
  });

  it('asks for nothing while there is no pet', () => {
    act(() => {
      create(<Host petId={null} />);
    });
    expect(latest).toBeNull();
  });

  it('does not ask again on re-render, only when the screen is opened again', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Host petId="p1" />);
    });
    const first = latest;
    act(() => tree.update(<Host petId="p1" />));
    expect(latest).toBe(first);

    mockFocus.value = false;
    act(() => tree.update(<Host petId="p1" />));
    mockFocus.value = true;
    act(() => tree.update(<Host petId="p1" />));
    expect(latest?.id).toBe('health-record-open:p1:2');
  });

  it('stays quiet when the screen is not focused', () => {
    mockFocus.value = false;
    act(() => {
      create(<Host petId="p1" />);
    });
    expect(latest).toBeNull();
  });
});
