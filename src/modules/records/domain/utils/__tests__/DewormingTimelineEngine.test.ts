import {
  generateDewormingTimeline,
  projectDewormingTimelineSections,
} from '../DewormingTimelineEngine';

describe('DewormingTimelineEngine', () => {
  it('handles no history for newborn-like onboarding', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-1',
        dateOfBirth: '2026-04-10',
        onboardingDate: '2026-04-10',
      },
      [],
      '2026-04-20',
    );
    const sections = projectDewormingTimelineSections(timeline);
    expect(sections.nextStep?.date).toBe('2026-04-24');
    expect(sections.history).toHaveLength(0);
  });

  it('handles late onboarding at six months without generating old puppy misses', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-2',
        dateOfBirth: '2025-10-01',
        onboardingDate: '2026-04-01',
      },
      [],
      '2026-04-10',
    );
    const overdue = timeline.filter(item => item.status === 'OVERDUE');
    expect(overdue).toHaveLength(1);
    expect(overdue[0]?.date).toBe('2026-04-01');
  });

  it('late completion shifts all future from completed date', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-3',
        dateOfBirth: '2026-01-01',
        onboardingDate: '2026-01-20',
      },
      [{ date: '2026-03-10', type: 'completed' }],
      '2026-03-15',
    );
    const firstUpcoming = timeline.find(item => item.status === 'UPCOMING');
    expect(firstUpcoming?.date).toBe('2026-03-24');
  });

  it('early completion keeps minimum safe gap (14 days in early puppy phase)', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-4',
        dateOfBirth: '2026-03-01',
        onboardingDate: '2026-03-10',
      },
      [{ date: '2026-03-15', type: 'completed' }],
      '2026-03-16',
    );
    const firstUpcoming = timeline.find(item => item.status === 'UPCOMING');
    expect(firstUpcoming?.date).toBe('2026-03-29');
  });

  it('multiple missed doses are not stacked in upcoming list', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-5',
        dateOfBirth: '2025-01-01',
        onboardingDate: '2025-01-20',
      },
      [{ date: '2025-09-01', type: 'completed' }],
      '2026-02-10',
    );
    const sections = projectDewormingTimelineSections(timeline);
    expect(sections.nextStep?.status).toBe('OVERDUE');
    expect(sections.comingUp.every(item => item.status === 'UPCOMING')).toBe(true);
  });

  it('skip dose adjusts forward logically from real-world timeline', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-6',
        dateOfBirth: '2025-01-01',
        onboardingDate: '2025-01-20',
      },
      [
        { date: '2025-10-01', type: 'completed' },
        { date: '2026-01-01', type: 'skipped', reason: 'travel' },
      ],
      '2026-01-10',
    );
    const sections = projectDewormingTimelineSections(timeline);
    expect(sections.history[0]?.status).toBe('SKIPPED');
    expect(sections.nextStep?.date).toBe('2026-04-01');
  });

  it('history contains only user-logged events and is sorted desc', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-7',
        dateOfBirth: '2025-01-01',
        onboardingDate: '2025-01-20',
      },
      [
        { date: '2025-07-01', type: 'completed' },
        { date: '2025-10-01', type: 'completed' },
      ],
      '2025-10-15',
    );
    const sections = projectDewormingTimelineSections(timeline);
    expect(sections.history).toHaveLength(2);
    expect(sections.history[0]?.date).toBe('2025-10-01');
    expect(sections.history[1]?.date).toBe('2025-07-01');
  });

  it('next step is excluded from coming up', () => {
    const timeline = generateDewormingTimeline(
      {
        id: 'pet-8',
        dateOfBirth: '2025-01-01',
        onboardingDate: '2025-01-20',
      },
      [{ date: '2025-10-01', type: 'completed' }],
      '2025-10-10',
    );
    const sections = projectDewormingTimelineSections(timeline);
    expect(
      sections.comingUp.some(item => item.id === sections.nextStep?.id),
    ).toBe(false);
  });
});
