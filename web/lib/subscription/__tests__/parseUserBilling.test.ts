import { parseStoredSubscription } from '../parseUserBilling';

describe('parseStoredSubscription', () => {
  it('accepts revenuecat provider', () => {
    const parsed = parseStoredSubscription({
      provider: 'revenuecat',
      planKey: 'care_plus',
      billingPeriod: 'monthly',
      status: 'active',
      currentPeriodEnd: '2026-10-01T00:00:00.000Z',
      gracePeriodEndsAt: null,
      revenueCatProductId: 'care_plus_monthly',
    });
    expect(parsed?.provider).toBe('revenuecat');
    expect(parsed?.planKey).toBe('care_plus');
  });

  it('rejects unknown provider', () => {
    expect(parseStoredSubscription({ provider: 'stripe', planKey: 'care_plus' })).toBeNull();
  });
});
