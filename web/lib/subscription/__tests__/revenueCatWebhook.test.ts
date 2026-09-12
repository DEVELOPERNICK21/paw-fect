import {
  isRevenueCatWebhookAuthorized,
  mapRevenueCatEventToSubscription,
} from '../revenueCatWebhook';

describe('revenueCatWebhook', () => {
  it('authorizes matching Bearer secret', () => {
    expect(
      isRevenueCatWebhookAuthorized('Bearer test-secret', 'test-secret'),
    ).toBe(true);
    expect(isRevenueCatWebhookAuthorized('Bearer nope', 'test-secret')).toBe(
      false,
    );
  });

  it('maps INITIAL_PURCHASE to active care_plus', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'firebase-uid-1',
      product_id: 'care_plus_monthly',
      expiration_at_ms: Date.parse('2026-10-13T00:00:00.000Z'),
      entitlement_ids: ['care_plus'],
    });
    expect(sub).toMatchObject({
      provider: 'revenuecat',
      planKey: 'care_plus',
      billingPeriod: 'monthly',
      status: 'active',
      revenueCatProductId: 'care_plus_monthly',
    });
    expect(sub?.currentPeriodEnd).toBe('2026-10-13T00:00:00.000Z');
  });

  it('maps EXPIRATION to cancelled', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'EXPIRATION',
      app_user_id: 'firebase-uid-1',
      product_id: 'care_plus_monthly',
      expiration_at_ms: Date.parse('2026-09-01T00:00:00.000Z'),
      entitlement_ids: ['care_plus'],
    });
    expect(sub?.status).toBe('cancelled');
  });

  it('maps BILLING_ISSUE to past_due with grace end', () => {
    const sub = mapRevenueCatEventToSubscription({
      type: 'BILLING_ISSUE',
      app_user_id: 'firebase-uid-1',
      product_id: 'family_monthly',
      expiration_at_ms: Date.parse('2026-09-20T00:00:00.000Z'),
      entitlement_ids: ['family'],
      event_timestamp_ms: Date.parse('2026-09-13T00:00:00.000Z'),
    });
    expect(sub?.status).toBe('past_due');
    expect(sub?.gracePeriodEndsAt).toBeTruthy();
  });
});
