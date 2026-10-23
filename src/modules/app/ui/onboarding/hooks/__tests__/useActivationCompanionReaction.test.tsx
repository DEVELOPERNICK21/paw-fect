import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { MascotReactionRequest } from '../../../../../../shared/components/Mascot';
import { useActivationCompanionReaction } from '../useActivationCompanionReaction';

let latest: MascotReactionRequest | null = null;
const Host: React.FC<{ step: number; valid: boolean }> = ({ step, valid }) => {
  latest = useActivationCompanionReaction(step, valid);
  return null;
};

function mount(step: number, valid: boolean): (step: number, valid: boolean) => void {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Host step={step} valid={valid} />);
  });
  return (nextStep, nextValid) => {
    act(() => tree.update(<Host step={nextStep} valid={nextValid} />));
  };
}

beforeEach(() => {
  latest = null;
});

describe('useActivationCompanionReaction', () => {
  it('asks for nothing on the first step until it becomes valid', () => {
    mount(0, false);
    expect(latest).toBeNull();
  });

  it('cheers (success) when the step becomes valid, once per change', () => {
    const update = mount(0, false);
    update(0, true);
    expect(latest?.reaction).toBe('success');
    const id = latest?.id;
    update(0, true);
    expect(latest?.id).toBe(id);
    update(0, false);
    update(0, true);
    expect(latest?.id).not.toBe(id);
  });

  it('welcomes the named pet when the reminder step opens', () => {
    const update = mount(0, true);
    update(1, false);
    expect(latest?.reaction).toBe('welcome');
  });

  it('going back to the first step clears the request', () => {
    const update = mount(0, true);
    update(1, true);
    update(0, true);
    expect(latest).toBeNull();
  });

  it('does not cheer for a step that was already valid when it opened', () => {
    const update = mount(0, true);
    update(1, true);
    expect(latest?.reaction).toBe('welcome');
  });
});
