import { computeEntitlement } from '../entitlementEngine';

describe('computeEntitlement with revenuecat', () => {
  it('grants paid care_plus when revenuecat subscription is active', () => {
    const e = computeEntitlement({
      now: new Date('2026-09-13T12:00:00.000Z'),
      trialEndsAt: null,
      trialConsumed: true,
      subscription: {
        provider: 'revenuecat',
        planKey: 'care_plus',
        billingPeriod: 'monthly',
        status: 'active',
        currentPeriodEnd: '2026-10-13T12:00:00.000Z',
        gracePeriodEndsAt: null,
        revenueCatProductId: 'care_plus_monthly',
      },
    });
    expect(e.source).toBe('paid');
    expect(e.plan).toBe('care_plus');
  });

  it('grants paid care_plus for weekly billing period', () => {
    const e = computeEntitlement({
      now: new Date('2026-09-13T12:00:00.000Z'),
      trialEndsAt: null,
      trialConsumed: true,
      subscription: {
        provider: 'revenuecat',
        planKey: 'care_plus',
        billingPeriod: 'weekly',
        status: 'active',
        currentPeriodEnd: '2026-09-20T12:00:00.000Z',
        gracePeriodEndsAt: null,
        revenueCatProductId: 'care_plus_weekly',
      },
    });
    expect(e.source).toBe('paid');
    expect(e.plan).toBe('care_plus');
    expect(e.maxPets).toBe(3);
  });
});
