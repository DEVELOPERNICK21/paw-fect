import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { PetFormSection } from '../PetFormSection';

describe('PetFormSection', () => {
  it('hides children while collapsed and calls onToggle', () => {
    const onToggle = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetFormSection
          title="About"
          optional
          collapsible
          expanded={false}
          collapsedSummary="Gender and breed"
          onToggle={onToggle}
        >
          <Text>Breed field</Text>
        </PetFormSection>,
      );
    });

    expect(
      tree!.root.findAllByType(Text).some(n => n.props.children === 'Breed field'),
    ).toBe(false);

    const toggle = tree!.root.findByProps({ accessibilityRole: 'button' });
    act(() => {
      toggle.props.onPress();
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows children when expanded', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetFormSection title="Lifestyle" expanded>
          <Text>Indoor</Text>
        </PetFormSection>,
      );
    });

    expect(
      tree!.root.findAllByType(Text).some(n => n.props.children === 'Indoor'),
    ).toBe(true);
  });
});
