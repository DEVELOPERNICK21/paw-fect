import React from 'react';
import { Image } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Mascot } from '../Mascot';
import { COMPANION_RIVE_SOURCE, COMPANION_STILL } from '../mascotRiveSource';
import { MASCOT_MOODS, type MascotHandle } from '../mascotTypes';

let mockReduceMotion = false;
let mockScreenFocused = true;
let mockRiveRenders: Array<Record<string, unknown>> = [];

jest.mock('../../../hooks/useReduceMotion', () => ({
  useReduceMotion: () => mockReduceMotion,
}));

jest.mock('../useScreenFocused', () => ({
  useScreenFocused: () => mockScreenFocused,
}));

// The real RiveMascot needs the native runtime (see RiveMascot.test.tsx); here it only records its props.
jest.mock('../RiveMascot', () => {
  const { forwardRef } = jest.requireActual<typeof import('react')>('react');
  return {
    RiveMascot: forwardRef((props: Record<string, unknown>, _ref: unknown) => {
      mockRiveRenders.push(props);
      return null;
    }),
  };
});

const mounted: ReactTestRenderer[] = [];

function mount(element: React.ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  mounted.push(tree);
  return tree;
}

const lastRive = (): Record<string, unknown> | undefined => mockRiveRenders[mockRiveRenders.length - 1];
const buttons = (tree: ReactTestRenderer): ReturnType<ReactTestRenderer['root']['findAll']> =>
  tree.root.findAll(n => n.props.accessibilityRole === 'button');

beforeEach(() => {
  mockReduceMotion = false;
  mockScreenFocused = true;
  mockRiveRenders = [];
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
});

describe('Mascot (the companion)', () => {
  it.each(MASCOT_MOODS)('plays the companion Rive file in the %s mood, whatever the species', mood => {
    for (const species of ['dog', 'cat'] as const) {
      mockRiveRenders = [];
      const tree = mount(<Mascot mood={mood} species={species} size={80} />);
      expect(lastRive()?.source).toBe(COMPANION_RIVE_SOURCE);
      expect(lastRive()?.mood).toBe(mood);
      expect(lastRive()?.size).toBe(80);
      act(() => tree.unmount());
    }
  });

  it('defaults to 96 px', () => {
    mount(<Mascot mood="happy" />);
    expect(lastRive()?.size).toBe(96);
  });

  it.each(MASCOT_MOODS)('shows the still image in the %s mood when animation is off', mood => {
    const tree = mount(<Mascot mood={mood} animated={false} size={90} />);
    expect(mockRiveRenders).toHaveLength(0);
    const image = tree.root.findByType(Image);
    expect(image.props.source).toBe(COMPANION_STILL);
    expect(image.props.style).toMatchObject({ width: 90, height: 90 });
  });

  it('shows the still image, not Rive, for Reduce Motion', () => {
    mockReduceMotion = true;
    const tree = mount(<Mascot mood="happy" />);
    expect(mockRiveRenders).toHaveLength(0);
    expect(tree.root.findAllByType(Image)).toHaveLength(1);
  });

  it('falls back to the still image if the Rive file reports a failure', () => {
    const tree = mount(<Mascot mood="happy" />);
    expect(tree.root.findAllByType(Image)).toHaveLength(0);
    const onFailed = lastRive()?.onFailed as () => void;
    act(() => onFailed());
    expect(tree.root.findAllByType(Image)).toHaveLength(1);
  });

  it('releases the native surface while the screen is not focused', () => {
    mockScreenFocused = false;
    const tree = mount(<Mascot mood="happy" size={70} testID="m" />);
    expect(mockRiveRenders).toHaveLength(0);
    expect(tree.root.findAllByType(Image)).toHaveLength(0);
    expect(tree.toJSON()).toMatchObject({ props: { style: { width: 70, height: 70 } } });
  });

  it('the still image honestly reports that it cannot play reactions', () => {
    const handle = React.createRef<MascotHandle>();
    mount(<Mascot ref={handle} mood="happy" animated={false} />);
    expect(handle.current).not.toBeNull();
    expect(handle.current?.react('success')).toBe(false);
  });

  it('is hidden from screen readers unless given a label, still or animated', () => {
    const still = mount(<Mascot mood="happy" animated={false} testID="c" />);
    const host = still.root.findAll(n => String(n.type) === 'View' && n.props.testID === 'c')[0];
    expect(host.props.accessibilityElementsHidden).toBe(true);
    expect(buttons(still)).toHaveLength(0);

    mount(<Mascot mood="happy" />);
    expect(lastRive()?.accessibilityLabel).toBeUndefined();

    const labelled = mount(<Mascot mood="happy" animated={false} testID="l" accessibilityLabel="Your guide" />);
    const labelledHost = labelled.root.findAll(n => String(n.type) === 'View' && n.props.testID === 'l')[0];
    expect(labelledHost.props.accessible).toBe(true);
    expect(labelledHost.props.accessibilityLabel).toBe('Your guide');
  });

  it('is a labelled button when interactive, and taps reach onPress (still image)', () => {
    const onPress = jest.fn();
    const tree = mount(<Mascot mood="happy" animated={false} onPress={onPress} />);
    const button = buttons(tree)[0];
    expect(button.props.accessibilityLabel).toBe('Companion');
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is tappable when interactive, even without onPress, and not tappable by default', () => {
    expect(buttons(mount(<Mascot mood="happy" animated={false} interactive />))).not.toHaveLength(0);
    expect(buttons(mount(<Mascot mood="happy" animated={false} />))).toHaveLength(0);
  });

  it('labels an interactive animated companion "Companion", and keeps a caller label', () => {
    mount(<Mascot mood="happy" interactive />);
    expect(lastRive()?.accessibilityLabel).toBe('Companion');
    mount(<Mascot mood="happy" interactive accessibilityLabel="Your guide" />);
    expect(lastRive()?.accessibilityLabel).toBe('Your guide');
  });

  it('passes reactionRequest, paused and onPress through to the Rive view', () => {
    const onPress = jest.fn();
    const reactionRequest = { reaction: 'celebrate', id: 'level-3' } as const;
    mount(<Mascot mood="happy" paused onPress={onPress} reactionRequest={reactionRequest} />);
    expect(lastRive()?.paused).toBe(true);
    expect(lastRive()?.onPress).toBe(onPress);
    expect(lastRive()?.reactionRequest).toBe(reactionRequest);
    expect(lastRive()?.interactive).toBe(true);
  });
});
