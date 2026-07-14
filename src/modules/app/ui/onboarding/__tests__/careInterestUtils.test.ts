import {
  CARE_INTEREST_OPTIONS,
  toggleCareInterest,
} from '../careInterestUtils';
import type { CareInterest } from '../../../../settings/domain/models/Settings';

describe('toggleCareInterest', () => {
  it('adds an interest when missing', () => {
    const next = toggleCareInterest([], 'vaccines');
    expect(next).toEqual(['vaccines']);
  });

  it('removes an interest when present', () => {
    const current: CareInterest[] = ['vaccines', 'walks'];
    expect(toggleCareInterest(current, 'vaccines')).toEqual(['walks']);
  });

  it('does not mutate the original array', () => {
    const current: CareInterest[] = ['meds'];
    const next = toggleCareInterest(current, 'grooming');
    expect(current).toEqual(['meds']);
    expect(next).toEqual(['meds', 'grooming']);
  });

  it('exposes four labeled options', () => {
    expect(CARE_INTEREST_OPTIONS.map(o => o.id)).toEqual([
      'vaccines',
      'walks',
      'meds',
      'grooming',
    ]);
  });
});
