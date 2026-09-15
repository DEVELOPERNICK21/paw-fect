import {
  formatPlanDisplayName,
  formatSubscriptionStatusLine,
} from '../formatPlanLabel';
import type { ComputedEntitlement } from '../entitlementEngine';

describe('formatPlanLabel', () => {
  const base: ComputedEntitlement = {
    plan: 'free',
    source: 'free',
    maxPets: 1,
    historyMonthsCap: 3,
    pdfExport: false,
    offline: false,
    sharing: false,
    multiUser: false,
    vetPortal: false,
    prioritySupport: false,
    trialActive: false,
    trialEndsAt: null,
    trialConsumed: true,
    graceActive: false,
    gracePeriodEndsAt: null,
    computedAt: '2026-09-13T00:00:00.000Z',
  };

  it('formats plan display names', () => {
    expect(formatPlanDisplayName('free')).toBe('Free');
    expect(formatPlanDisplayName('care_plus')).toBe('Care+');
    expect(formatPlanDisplayName('family')).toBe('Family');
  });

  it('shows active paid Care+', () => {
    expect(
      formatSubscriptionStatusLine({
        ...base,
        plan: 'care_plus',
        source: 'paid',
        maxPets: 3,
        historyMonthsCap: null,
        offline: true,
      }),
    ).toBe('Care+ · active · up to 3 pets');
  });

  it('shows trial line', () => {
    expect(
      formatSubscriptionStatusLine({
        ...base,
        plan: 'care_plus',
        source: 'trial',
        trialActive: true,
        maxPets: 3,
        historyMonthsCap: null,
      }),
    ).toBe('Care+ · trial · up to 3 pets');
  });
});
