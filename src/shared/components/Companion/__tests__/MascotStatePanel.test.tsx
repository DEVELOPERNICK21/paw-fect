import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Button } from '../../Button';
import { MascotEmptyState, MascotErrorState } from '../MascotStatePanel';
import { MascotLoader } from '../MascotLoader';

let mockMascotProps: Array<Record<string, unknown>> = [];

jest.mock('../../Mascot', () => ({
  Mascot: (props: Record<string, unknown>) => {
    mockMascotProps.push(props);
    return null;
  },
}));

const lastMascot = (): Record<string, unknown> => mockMascotProps[mockMascotProps.length - 1];

const mounted: ReactTestRenderer[] = [];
function mount(element: React.ReactElement): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  mounted.push(tree);
  return tree;
}

const texts = (tree: ReactTestRenderer): string[] =>
  tree.root
    .findAll(n => String(n.type) === 'Text')
    .map(n => [n.props.children].flat().join(''));

beforeEach(() => {
  mockMascotProps = [];
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
  jest.useRealTimers();
});

describe('MascotEmptyState', () => {
  it('shows a friendly companion, the title, the first line and the action', () => {
    const onAction = jest.fn();
    const tree = mount(
      <MascotEmptyState
        title="No reminders yet"
        lines={['First line', 'Second line']}
        actionLabel="Add reminder"
        onAction={onAction}
      />,
    );
    expect(lastMascot().mood).toBe('happy');
    expect(lastMascot().reactionRequest).toBeNull();
    expect(texts(tree)).toEqual(expect.arrayContaining(['No reminders yet', 'First line', 'Add reminder']));

    act(() => tree.root.findByType(Button).props.onPress());
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('a tap on the companion brings up its next line, then wraps around', () => {
    const tree = mount(<MascotEmptyState lines={['One', 'Two']} />);
    const tap = lastMascot().onPress as () => void;
    act(() => tap());
    expect(texts(tree)).toContain('Two');
    act(() => (lastMascot().onPress as () => void)());
    expect(texts(tree)).toContain('One');
  });

  it('can use the still image', () => {
    mount(<MascotEmptyState lines={['x']} animated={false} />);
    expect(lastMascot().animated).toBe(false);
  });
});

describe('MascotErrorState', () => {
  it('is calm (nudge) and plays attention once when shown', () => {
    const onRetry = jest.fn();
    const tree = mount(<MascotErrorState lines={['Oops']} onRetry={onRetry} />);
    expect(lastMascot().mood).toBe('nudge');
    const request = lastMascot().reactionRequest as { reaction: string; id: string };
    expect(request.reaction).toBe('attention');

    act(() => tree.update(<MascotErrorState lines={['Oops']} onRetry={onRetry} />));
    expect((lastMascot().reactionRequest as { id: string }).id).toBe(request.id);

    expect(texts(tree)).toContain('Try again');
  });

  it('a new error panel asks for a new attention reaction', () => {
    mount(<MascotErrorState lines={['a']} onRetry={jest.fn()} />);
    const first = (lastMascot().reactionRequest as { id: string }).id;
    mount(<MascotErrorState lines={['b']} onRetry={jest.fn()} />);
    expect((lastMascot().reactionRequest as { id: string }).id).not.toBe(first);
  });
});

describe('MascotLoader', () => {
  it('shows the thinking companion and rotates its lines', () => {
    jest.useFakeTimers();
    const tree = mount(<MascotLoader lines={['Saving...', 'Almost there...']} rotateMs={1000} />);
    expect(lastMascot().mood).toBe('thinking');
    expect(texts(tree)).toContain('Saving...');
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(texts(tree)).toContain('Almost there...');
  });

  it('does not restart the rotation when re-rendered with equal lines', () => {
    jest.useFakeTimers();
    const tree = mount(<MascotLoader lines={['A', 'B']} rotateMs={1000} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => tree.update(<MascotLoader lines={['A', 'B']} rotateMs={1000} />));
    expect(texts(tree)).toContain('B');
  });

  it('is announced as progress with the current line', () => {
    const tree = mount(<MascotLoader lines={['Saving...']} testID="l" />);
    const root = tree.root.findAll(n => n.props.testID === 'l' && n.props.accessibilityRole)[0];
    expect(root.props.accessibilityRole).toBe('progressbar');
    expect(root.props.accessibilityLabel).toBe('Saving...');
  });
});
