import type { HomeDashboardViewModel } from '../../models/HomeDashboardViewModel';
import { mascotMoodForHome, mascotSpeciesFor } from '../mascotMood';

const pet = {
  id: 'pet-1',
  userId: 'user-1',
  name: 'Tiger',
  type: 'dog' as const,
  breed: 'Labrador',
  dob: '2020-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const midday = new Date(2026, 4, 16, 12, 0, 0);

const baseVm = (overrides: Partial<HomeDashboardViewModel> = {}): HomeDashboardViewModel => ({
  now: midday.toISOString(),
  petsLoading: false,
  remindersLoading: false,
  hasAnyPet: true,
  activePet: pet,
  healthStatusLine: '',
  nextCareMilestoneLine: '',
  nextMilestone: null,
  lastActivityLine: '',
  lastLoggedDateLine: '',
  weightLine: '',
  activityLine: '',
  heartLine: '',
  attentionBanner: { show: false, headline: '', subline: '' },
  todayCare: [],
  weekCarePreview: [],
  actionHealthItems: [],
  lastError: null,
  isRefreshing: false,
  ...overrides,
});

const milestoneIn = (days: number): HomeDashboardViewModel['nextMilestone'] => {
  const d = new Date(midday);
  d.setDate(d.getDate() + days);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    title: 'Rabies',
    dueDateYmd: ymd,
    dueDateLabel: ymd,
    countdownLabel: `in ${days} days`,
    kind: 'vaccination',
  };
};

const careItem = (done: boolean) => ({
  reminder: {
    id: `r-${String(done)}`,
    petId: 'pet-1',
    title: 'Walk',
    type: 'other' as const,
    date: '2026-05-16',
    time: '18:00',
    repeat: 'daily' as const,
    notes: '',
    notificationId: null,
  },
  showCompletedCheck: done,
});

describe('mascotMoodForHome', () => {
  it('waves hello when there is no pet yet', () => {
    expect(mascotMoodForHome(baseVm({ hasAnyPet: false, activePet: null }), midday)).toBe('wave');
  });

  it('nudges (never upset) when something is overdue', () => {
    const vm = baseVm({
      actionHealthItems: [
        { id: 'a', title: 'Rabies', kind: 'vaccination', dueDateLabel: '', countdownLabel: 'Overdue', urgency: 'overdue' },
      ],
    });
    expect(mascotMoodForHome(vm, midday)).toBe('nudge');
  });

  it('nudges when the attention banner is showing', () => {
    const vm = baseVm({ attentionBanner: { show: true, headline: 'x', subline: 'y' } });
    expect(mascotMoodForHome(vm, midday)).toBe('nudge');
  });

  it('is curious when a milestone is within a week, relaxed when further out', () => {
    expect(mascotMoodForHome(baseVm({ nextMilestone: milestoneIn(3) }), midday)).toBe('curious');
    expect(mascotMoodForHome(baseVm({ nextMilestone: milestoneIn(7) }), midday)).toBe('curious');
    expect(mascotMoodForHome(baseVm({ nextMilestone: milestoneIn(30) }), midday)).toBe('happy');
  });

  it('is proud when every task for today is done', () => {
    expect(
      mascotMoodForHome(baseVm({ todayCare: [careItem(true), careItem(true)] }), midday),
    ).toBe('proud');
    expect(
      mascotMoodForHome(baseVm({ todayCare: [careItem(true), careItem(false)] }), midday),
    ).toBe('happy');
  });

  it('sleeps late at night when nothing needs attention', () => {
    const night = new Date(2026, 4, 16, 22, 30, 0);
    const earlyMorning = new Date(2026, 4, 16, 4, 0, 0);
    expect(mascotMoodForHome(baseVm(), night)).toBe('sleepy');
    expect(mascotMoodForHome(baseVm(), earlyMorning)).toBe('sleepy');
  });

  it('still nudges at night when something is overdue (care beats bedtime)', () => {
    const night = new Date(2026, 4, 16, 22, 30, 0);
    const vm = baseVm({ attentionBanner: { show: true, headline: 'x', subline: 'y' } });
    expect(mascotMoodForHome(vm, night)).toBe('nudge');
  });
});

describe('mascotSpeciesFor', () => {
  it('uses the cat for cats and the dog for everything else', () => {
    expect(mascotSpeciesFor('cat')).toBe('cat');
    expect(mascotSpeciesFor('dog')).toBe('dog');
    expect(mascotSpeciesFor('both')).toBe('dog');
    expect(mascotSpeciesFor(undefined)).toBe('dog');
  });
});
