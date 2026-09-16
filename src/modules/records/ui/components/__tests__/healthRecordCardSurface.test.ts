import type { AppColors } from '../../../../../shared/theme/colors';
import { resolveHealthRecordCardSurface } from '../healthRecordCardSurface';

const colors = {
  brandTint12: 'brandTint12',
  dangerSurface: 'dangerSurface',
  surface: 'surface',
} as unknown as AppColors;

describe('resolveHealthRecordCardSurface', () => {
  it('uses dangerSurface for overdue and missed', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'overdue',
        isHero: true,
        colors,
      }),
    ).toBe('dangerSurface');
    expect(
      resolveHealthRecordCardSurface({
        status: 'missed',
        isHero: false,
        colors,
      }),
    ).toBe('dangerSurface');
  });

  it('uses brandTint12 for hero upcoming', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'upcoming',
        isHero: true,
        colors,
      }),
    ).toBe('brandTint12');
  });

  it('uses surface for non-hero upcoming and completed', () => {
    expect(
      resolveHealthRecordCardSurface({
        status: 'upcoming',
        isHero: false,
        colors,
      }),
    ).toBe('surface');
    expect(
      resolveHealthRecordCardSurface({
        status: 'completed',
        isHero: false,
        colors,
      }),
    ).toBe('surface');
  });
});
