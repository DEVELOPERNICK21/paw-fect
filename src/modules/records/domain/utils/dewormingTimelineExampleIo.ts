/**
 * Example input/output for pure timeline API:
 * generateDewormingTimeline(pet, history, today)
 * + projectDewormingTimelineSections(timeline)
 */

export const examplePetInput = {
  id: 'pet-1',
  dateOfBirth: '2026-03-26',
  onboardingDate: '2026-04-09',
};

export const exampleHistoryInput = [
  { date: '2026-04-09', type: 'completed' as const },
  { date: '2026-04-23', type: 'completed' as const },
];

export const exampleToday = '2026-04-25';

export const expectedSections = {
  nextStep: { date: '2026-05-07', status: 'UPCOMING' as const },
  comingUpDates: ['2026-05-21', '2026-06-21'],
  historyDatesDesc: ['2026-04-23', '2026-04-09'],
};
