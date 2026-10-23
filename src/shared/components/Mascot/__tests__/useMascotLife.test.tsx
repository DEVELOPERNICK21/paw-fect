import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { IdleLife, IdleStep } from '../mascotInteraction';
import { useMascotLife } from '../useMascotLife';

const GLANCE: IdleStep = {
  delayMs: 10000,
  beat: { kind: 'glance', gaze: { x: 0.85, y: 0.15 }, holdMs: 1300 },
};
const HM: IdleStep = { delayMs: 30000, beat: { kind: 'react', reaction: 'curious' } };

function scriptedLife(steps: IdleStep[]): { life: IdleLife; resets: () => number } {
  let i = 0;
  let resets = 0;
  return {
    life: {
      next: () => steps[i++ % steps.length],
      reset: () => {
        resets += 1;
        i = 0;
      },
    },
    resets: () => resets,
  };
}

let api: { poke: () => void } | null = null;
const Host: React.FC<{
  enabled: boolean;
  react: jest.Mock;
  look: jest.Mock;
  life: IdleLife;
}> = ({ enabled, react, look, life }) => {
  api = useMascotLife({ enabled, react, look, createLife: () => life });
  return null;
};

const mounted: ReactTestRenderer[] = [];
function mount(props: React.ComponentProps<typeof Host>): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Host {...props} />);
  });
  mounted.push(tree);
  return tree;
}

beforeEach(() => {
  jest.useFakeTimers();
  api = null;
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
  jest.useRealTimers();
});

describe('useMascotLife', () => {
  it('does nothing before the first delay has passed', () => {
    const react = jest.fn();
    const look = jest.fn();
    mount({ enabled: true, react, look, life: scriptedLife([GLANCE, HM]).life });
    act(() => {
      jest.advanceTimersByTime(9999);
    });
    expect(look).not.toHaveBeenCalled();
    expect(react).not.toHaveBeenCalled();
  });

  it('glances, then asks "hm?", following the plan', () => {
    const react = jest.fn();
    const look = jest.fn();
    mount({ enabled: true, react, look, life: scriptedLife([GLANCE, HM]).life });
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(look).toHaveBeenCalledTimes(1);
    expect(look).toHaveBeenCalledWith(0.85, 0.15, 1300);
    expect(react).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(react).toHaveBeenCalledTimes(1);
    expect(react).toHaveBeenCalledWith('curious');
  });

  it('keeps going, one beat at a time', () => {
    const look = jest.fn();
    mount({ enabled: true, react: jest.fn(), look, life: scriptedLife([GLANCE]).life });
    act(() => {
      jest.advanceTimersByTime(10000 * 4);
    });
    expect(look).toHaveBeenCalledTimes(4);
  });

  it('never fidgets while disabled, and holds no timer', () => {
    const react = jest.fn();
    const look = jest.fn();
    mount({ enabled: false, react, look, life: scriptedLife([GLANCE, HM]).life });
    expect(jest.getTimerCount()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(120000);
    });
    expect(look).not.toHaveBeenCalled();
    expect(react).not.toHaveBeenCalled();
  });

  it('stops when it becomes disabled (e.g. the screen lost focus) and resumes when enabled', () => {
    const look = jest.fn();
    const react = jest.fn();
    const { life } = scriptedLife([GLANCE]);
    const tree = mount({ enabled: true, react, look, life });
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(look).toHaveBeenCalledTimes(1);
    act(() => tree.update(<Host enabled={false} react={react} look={look} life={life} />));
    expect(jest.getTimerCount()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(look).toHaveBeenCalledTimes(1);
    act(() => tree.update(<Host enabled react={react} look={look} life={life} />));
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(look).toHaveBeenCalledTimes(2);
  });

  it('a touch (poke) restarts the quiet period, so it never fidgets mid-interaction', () => {
    const look = jest.fn();
    const sc = scriptedLife([GLANCE]);
    mount({ enabled: true, react: jest.fn(), look, life: sc.life });
    act(() => {
      jest.advanceTimersByTime(9000);
    });
    act(() => api?.poke());
    act(() => {
      jest.advanceTimersByTime(9000); // 18 s since mount, but only 9 s since the touch
    });
    expect(look).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(look).toHaveBeenCalledTimes(1);
    expect(sc.resets()).toBeGreaterThanOrEqual(2); // on enable and on poke
  });

  it('poke does nothing, and starts no timer, while disabled', () => {
    mount({ enabled: false, react: jest.fn(), look: jest.fn(), life: scriptedLife([GLANCE]).life });
    act(() => api?.poke());
    expect(jest.getTimerCount()).toBe(0);
  });

  it('uses the latest react/look callbacks without restarting the timer', () => {
    const lookA = jest.fn();
    const lookB = jest.fn();
    const react = jest.fn();
    const { life } = scriptedLife([GLANCE]);
    const tree = mount({ enabled: true, react, look: lookA, life });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    act(() => tree.update(<Host enabled react={react} look={lookB} life={life} />));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(lookA).not.toHaveBeenCalled();
    expect(lookB).toHaveBeenCalledTimes(1);
  });

  it('clears its timer on unmount', () => {
    const tree = mount({ enabled: true, react: jest.fn(), look: jest.fn(), life: scriptedLife([GLANCE]).life });
    expect(jest.getTimerCount()).toBe(1);
    act(() => tree.unmount());
    expect(jest.getTimerCount()).toBe(0);
  });

  it('works with the real idle plan too: nothing for 9 s, a glance by 15 s', () => {
    const look = jest.fn();
    const react = jest.fn();
    let tree!: ReactTestRenderer;
    const Real: React.FC = () => {
      useMascotLife({ enabled: true, react, look });
      return null;
    };
    act(() => {
      tree = create(<Real />);
    });
    mounted.push(tree);
    act(() => {
      jest.advanceTimersByTime(9900);
    });
    expect(look).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5100);
    });
    expect(look).toHaveBeenCalledTimes(1);
  });
});
