import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { SmoothTabIcon } from '../SmoothTabIcon';

describe('SmoothTabIcon', () => {
  it.each(['home', 'favorite', 'wellness', 'settings'] as const)(
    'renders Material-style %s glyph',
    name => {
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <SmoothTabIcon name={name} active={false} color="#111" />,
        );
      });
      expect(tree!.toJSON()).not.toBeNull();
    },
  );
});
