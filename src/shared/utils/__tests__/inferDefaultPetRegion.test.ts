import { inferDefaultPetRegion, resolveCarePlanRegion } from '../inferDefaultPetRegion';

describe('inferDefaultPetRegion', () => {
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;

  afterEach(() => {
    Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
  });

  it('returns IN for India locale', () => {
    Intl.DateTimeFormat.prototype.resolvedOptions = function resolvedOptions() {
      return { locale: 'en-IN', calendar: 'gregory', numberingSystem: 'latn' };
    };
    expect(inferDefaultPetRegion()).toBe('IN');
  });

  it('returns IN for Asia/Kolkata timezone', () => {
    Intl.DateTimeFormat.prototype.resolvedOptions = function resolvedOptions() {
      return {
        locale: 'en-US',
        timeZone: 'Asia/Kolkata',
        calendar: 'gregory',
        numberingSystem: 'latn',
      };
    };
    expect(inferDefaultPetRegion()).toBe('IN');
  });

  it('maps OTHER care-plan region to IN medical defaults', () => {
    expect(resolveCarePlanRegion('OTHER')).toBe('IN');
    expect(resolveCarePlanRegion('US')).toBe('US');
  });
});
