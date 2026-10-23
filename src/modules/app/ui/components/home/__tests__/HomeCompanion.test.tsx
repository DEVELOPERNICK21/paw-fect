import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { HomeDashboardViewModel } from '../../../../domain/models/HomeDashboardViewModel';
import type { HomeGreetingInput, HomeGreetingState } from '../../../hooks/useHomeGreeting';
import { HomeCompanion } from '../HomeCompanion';

let mockBubbleProps: Array<Record<string, unknown>> = [];
let mockPendingLevelUp: number | null = null;
let mockGreeting: HomeGreetingState = { request: null, lines: null, mood: null };
const mockGreetingCalls: HomeGreetingInput[] = [];

jest.mock('../../../hooks/useHomeGreeting', () => ({
  useHomeGreeting: (input: HomeGreetingInput) => {
    mockGreetingCalls.push(input);
    return mockGreeting;
  },
}));
jest.mock('../../../hooks/useActiveMascotSpecies', () => ({ useActiveMascotSpecies: () => 'dog' }));
jest.mock('../../../../../../shared/components/Companion', () => ({
  CompanionBubble: (props: Record<string, unknown>) => {
    mockBubbleProps.push(props);
    return null;
  },
  BuddyWalkPath: () => null,
  BuddyBondBar: () => null,
  companionLines: jest.requireActual('../../../../../../shared/components/Companion/companionVoice').companionLines,
}));
jest.mock('../../../../../schedule/store/buddyBondStore', () => ({
  useBondProgress: () => ({ level: 1, intoLevel: 0, forNext: 10, title: 'Pals' }),
  useBuddyBondStore: (selector: (s: unknown) => unknown) =>
    selector({ pendingLevelUp: mockPendingLevelUp, dismissLevelUp: () => undefined }),
}));
jest.mock('../../../../../schedule/store/scheduleStore', () => ({
  useScheduleStore: (selector: (s: unknown) => unknown) => selector({ careStreakDays: 3 }),
}));

const viewModel = (over: Partial<HomeDashboardViewModel> = {}): HomeDashboardViewModel =>
  ({
    now: new Date(2026, 4, 2, 14, 0, 0).toISOString(),
    hasAnyPet: true,
    activePet: { id: 'p1', name: 'Bruno', type: 'dog', dob: '2022-01-10' },
    attentionBanner: { show: false, headline: '', subline: '' },
    actionHealthItems: [],
    nextMilestone: null,
    todayCare: [],
    ...over,
  }) as unknown as HomeDashboardViewModel;

const mounted: ReactTestRenderer[] = [];
function mount(props: React.ComponentProps<typeof HomeCompanion>): void {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<HomeCompanion {...props} />);
  });
  mounted.push(tree);
}
const bubble = (): Record<string, unknown> => mockBubbleProps[mockBubbleProps.length - 1];

beforeEach(() => {
  mockBubbleProps = [];
  mockPendingLevelUp = null;
  mockGreeting = { request: null, lines: null, mood: null };
  mockGreetingCalls.length = 0;
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(t => t.unmount());
  });
});

describe('HomeCompanion with the greeting', () => {
  it('shows only Home\'s own lines and mood when there is no greeting', () => {
    mount({ viewModel: viewModel() });
    expect(bubble().reactionRequest).toBeNull();
    expect(bubble().mood).toBe('happy');
    expect((bubble().lines as string[])[0]).toMatch(/What's on the plan for Bruno/);
  });

  it('leads with the greeting, then goes on to Home\'s usual lines, and plays its reaction', () => {
    mockGreeting = {
      request: { reaction: 'welcome', id: 'home-greeting-1' },
      lines: ['Good afternoon! How is Bruno doing?', "I'm here if you need me."],
      mood: null,
    };
    mount({ viewModel: viewModel() });
    const lines = bubble().lines as string[];
    expect(lines[0]).toBe('Good afternoon! How is Bruno doing?');
    expect(lines[1]).toBe("I'm here if you need me.");
    expect(lines[2]).toMatch(/What's on the plan for Bruno/); // Home's own line is still one tap away
    expect(bubble().reactionRequest).toEqual({ reaction: 'welcome', id: 'home-greeting-1' });
    expect(bubble().mood).toBe('happy'); // a daily hello keeps Home's mood
  });

  it('lets a birthday or a return change the mood while it greets', () => {
    mockGreeting = {
      request: { reaction: 'celebrate', id: 'home-greeting-2' },
      lines: ['Happy birthday, Bruno! 4 years old today!', "I'm so glad I get to look after you."],
      mood: 'celebrating',
    };
    mount({ viewModel: viewModel() });
    expect(bubble().mood).toBe('celebrating');
    expect(bubble().reactionRequest).toEqual({ reaction: 'celebrate', id: 'home-greeting-2' });
  });

  it('a level-up is the bigger moment: it beats the greeting in lines, mood and reaction', () => {
    mockPendingLevelUp = 3;
    mockGreeting = {
      request: { reaction: 'welcome', id: 'home-greeting-3' },
      lines: ['Good morning! Ready for a day with Bruno?', "Let's see what's on the plan."],
      mood: 'wave',
    };
    mount({ viewModel: viewModel() });
    expect((bubble().lines as string[])[0]).toMatch(/Level 3/);
    expect((bubble().lines as string[]).some(l => /Good morning/.test(l))).toBe(false);
    expect(bubble().mood).toBe('celebrating');
    expect(bubble().reactionRequest).toEqual({ reaction: 'celebrate', id: 'levelup-3' });
  });

  it('keeps the overdue nudge line available behind a greeting', () => {
    mockGreeting = {
      request: { reaction: 'welcome', id: 'home-greeting-4' },
      lines: ['Welcome back! I missed you and Bruno.', "Let's see what's coming up."],
      mood: 'wave',
    };
    mount({
      viewModel: viewModel({
        attentionBanner: { show: true, headline: 'x', subline: 'y' },
      } as Partial<HomeDashboardViewModel>),
    });
    const lines = bubble().lines as string[];
    expect(lines[0]).toMatch(/Welcome back/);
    expect(lines.some(l => /need a look for Bruno/.test(l))).toBe(true);
  });

  it('asks for a greeting only when Home is the visible tab and a pet exists', () => {
    mount({ viewModel: viewModel(), paused: false });
    expect(mockGreetingCalls[mockGreetingCalls.length - 1]).toMatchObject({
      enabled: true,
      hasPet: true,
      petName: 'Bruno',
      petDob: '2022-01-10',
    });
    mount({ viewModel: viewModel(), paused: true });
    expect(mockGreetingCalls[mockGreetingCalls.length - 1].enabled).toBe(false);
    mount({ viewModel: viewModel({ hasAnyPet: false, activePet: null }) });
    expect(mockGreetingCalls[mockGreetingCalls.length - 1].hasPet).toBe(false);
  });
});
