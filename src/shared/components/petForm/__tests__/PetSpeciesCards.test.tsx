import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { PetSpeciesCards } from '../PetSpeciesCards';

describe('PetSpeciesCards', () => {
  it('calls onChange with the selected option id', () => {
    const onChange = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <PetSpeciesCards
          options={[
            { id: 'dog', label: 'Dog', kind: 'dog' },
            { id: 'cat', label: 'Cat', kind: 'cat' },
          ]}
          value="dog"
          onChange={onChange}
        />,
      );
    });
    const cat = tree!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityState?.checked === false,
    )[0];
    act(() => {
      cat.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('cat');
  });
});
