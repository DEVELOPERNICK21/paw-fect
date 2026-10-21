import React from 'react';
import { create, act } from 'react-test-renderer';

import { Mascot } from '../Mascot';
import { MASCOT_MOODS } from '../mascotTypes';

describe('Mascot', () => {
  it.each(MASCOT_MOODS)('renders the %s mood for a dog and a cat without crashing', mood => {
    for (const species of ['dog', 'cat'] as const) {
      let tree!: ReturnType<typeof create>;
      act(() => {
        tree = create(<Mascot mood={mood} species={species} animated={false} />);
      });
      expect(tree.toJSON()).not.toBeNull();
      act(() => tree.unmount());
    }
  });

  it('is hidden from screen readers unless given a label', () => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Mascot mood="happy" animated={false} testID="m" />);
    });
    const hostView = (): ReturnType<typeof tree.root.findByType> =>
      tree.root.findAll(node => String(node.type) === 'View' && node.props.testID === 'm')[0];
    expect(hostView().props.accessibilityElementsHidden).toBe(true);

    act(() => {
      tree.update(<Mascot mood="happy" animated={false} testID="m" accessibilityLabel="Happy dog" />);
    });
    expect(hostView().props.accessible).toBe(true);
    expect(hostView().props.accessibilityLabel).toBe('Happy dog');
    act(() => tree.unmount());
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<Mascot mood="happy" animated={false} onPress={onPress} testID="tap" />);
    });
    act(() => {
      tree.root.findByProps({ testID: 'tap' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });
});
