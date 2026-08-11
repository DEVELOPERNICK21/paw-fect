import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { TabDelightBurst } from '../TabDelightBurst';

describe('TabDelightBurst', () => {
  it('mounts for each glyph without crashing', () => {
    (
      ['home', 'favorite', 'wellness', 'settings', 'pets'] as const
    ).forEach(glyph => {
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(
          <TabDelightBurst glyph={glyph} playToken={1} color="#EF4444" />,
        );
      });
      expect(tree!.toJSON()).not.toBeNull();
    });
  });
});
