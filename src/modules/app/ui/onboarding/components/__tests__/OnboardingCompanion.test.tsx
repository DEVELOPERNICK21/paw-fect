import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { MascotHandle } from '../../../../../../shared/components/Mascot';
import { OnboardingCompanion, type OnboardingCompanionProps } from '../OnboardingCompanion';

const mockLook = jest.fn();
let mockBubbleProps: Array<Record<string, unknown>> = [];

jest.mock('../../../../../../shared/components/Companion', () => {
  const { useImperativeHandle } = jest.requireActual<typeof import('react')>('react');
  return {
    CompanionBubble: (props: Record<string, unknown>) => {
      mockBubbleProps.push(props);
      const ref = props.mascotRef as React.Ref<MascotHandle> | undefined;
      // The real bubble hands its ref to the Rive mascot; here the handle just records `look`.
      useImperativeHandle(ref, () => ({ react: () => true, look: mockLook }), []);
      return null;
    },
    companionLines: jest.requireActual('../../../../../../shared/components/Companion/companionVoice').companionLines,
  };
});

const mounted: ReactTestRenderer[] = [];
function mount(props: OnboardingCompanionProps): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<OnboardingCompanion {...props} />);
  });
  mounted.push(tree);
  return tree;
}
const withName = (petName: string): OnboardingCompanionProps => ({ step: 'petBasics', species: 'dog', petName });
const lastBubble = (): Record<string, unknown> => mockBubbleProps[mockBubbleProps.length - 1];

beforeEach(() => {
  mockLook.mockClear();
  mockBubbleProps = [];
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
});

describe('OnboardingCompanion reading along', () => {
  it('looks down at the field as soon as the pet-basics step opens', () => {
    mount(withName(''));
    expect(mockLook).toHaveBeenCalledTimes(1);
    expect(mockLook).toHaveBeenCalledWith(0, 0.4, 1800);
  });

  it('sweeps the eyes left to right as the name is typed', () => {
    const tree = mount(withName(''));
    for (const typed of ['B', 'Br', 'Bru', 'Brun', 'Bruno']) {
      act(() => tree.update(<OnboardingCompanion {...withName(typed)} />));
    }
    const xs = mockLook.mock.calls.slice(1).map(c => c[0] as number);
    expect(xs).toHaveLength(5);
    for (let i = 1; i < xs.length; i += 1) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
    expect(xs[0]).toBeGreaterThanOrEqual(-0.7);
    expect(xs[4]).toBeLessThanOrEqual(0.7);
  });

  it('holds the gaze for a moment after each keystroke', () => {
    mount(withName('Bruno'));
    expect(mockLook.mock.calls[0][2]).toBe(1800);
  });

  it('does not re-look when something else re-renders with the same name', () => {
    const tree = mount(withName('Bruno'));
    act(() => tree.update(<OnboardingCompanion {...withName('Bruno')} species="cat" />));
    expect(mockLook).toHaveBeenCalledTimes(1);
  });

  it('keeps its eyes still on every other step', () => {
    for (const step of ['welcome', 'firstReminder', 'trustOpen', 'goal', 'planReveal', 'commitment'] as const) {
      mockLook.mockClear();
      const tree = mount({ step, species: 'dog', petName: 'Bruno' });
      act(() => tree.update(<OnboardingCompanion step={step} species="dog" petName="Bruno Jr" />));
      expect(mockLook).not.toHaveBeenCalled();
    }
  });

  it('still passes the reaction request and the right mood through to the bubble', () => {
    const reactionRequest = { reaction: 'welcome', id: 'x' } as const;
    mount({ step: 'firstReminder', species: 'dog', petName: 'Bruno', reactionRequest });
    expect(lastBubble().reactionRequest).toBe(reactionRequest);
    expect(lastBubble().mood).toBe('curious');
    expect(lastBubble().testID).toBe('onboarding-companion-firstReminder');
  });

  it('copes with no name at all', () => {
    mount({ step: 'petBasics', species: 'cat' });
    expect(mockLook).toHaveBeenCalledWith(0, 0.4, 1800);
  });
});
