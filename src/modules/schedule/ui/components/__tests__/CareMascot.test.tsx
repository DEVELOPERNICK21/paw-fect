import React from 'react';
import { act, create } from 'react-test-renderer';

import type { CareAggregatedItem, CareDayViewModel } from '../../../domain/utils/careAggregator';
import { CareMascot } from '../CareMascot';

const mockFocus = { value: true };
let mockMascotProps: Record<string, unknown> = {};

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocus.value }));
jest.mock('../../../store/scheduleStore', () => ({ subscribeToCareCompletions: () => () => undefined }));
jest.mock('../../../../../shared/components/Mascot', () => ({
  Mascot: (props: Record<string, unknown>) => {
    mockMascotProps = props;
    return null;
  },
}));

const item = (blockId: string, urgency: CareAggregatedItem['urgency']) =>
  ({ urgency, pet: { id: 'p1' }, block: { id: blockId } }) as unknown as CareAggregatedItem;

type CareViewFixture = Pick<CareDayViewModel, 'items' | 'allGood' | 'attentionItem' | 'openCount'>;

const view = (items: CareAggregatedItem[], allGood = false): CareViewFixture => ({
  items,
  allGood,
  attentionItem: items[0] ?? null,
  openCount: items.length,
});

beforeEach(() => {
  mockFocus.value = true;
  mockMascotProps = {};
  jest.useFakeTimers({ now: new Date(2026, 9, 22, 10) });
});
afterEach(() => jest.useRealTimers());

const mount = (careView: CareViewFixture) => {
  act(() => {
    create(<CareMascot species="dog" careView={careView} petFilter="all" />);
  });
};

describe('CareMascot', () => {
  it('is calm and attentive (nudge) and looks up once when something is overdue', () => {
    mount(view([item('a', 'overdue')]));
    expect(mockMascotProps.mood).toBe('nudge');
    expect(mockMascotProps.reactionRequest).toMatchObject({ reaction: 'attention' });
  });

  it('is proud, with nothing to react to, when everything is done', () => {
    mount({ items: [item('a', 'done')], allGood: true, attentionItem: null, openCount: 0 });
    expect(mockMascotProps.mood).toBe('proud');
    expect(mockMascotProps.reactionRequest).toBeNull();
  });

  it('is happy with nothing to react to on an ordinary day', () => {
    mount(view([item('a', 'upcoming')]));
    expect(mockMascotProps.mood).toBe('happy');
    expect(mockMascotProps.reactionRequest).toBeNull();
  });

  it('is paused while the tab is not focused', () => {
    mockFocus.value = false;
    mount(view([item('a', 'overdue')]));
    expect(mockMascotProps.paused).toBe(true);
  });
});
