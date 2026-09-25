import { mapStoreProductIdToPlan } from '../mapStoreProductIdToPlan';

describe('mapStoreProductIdToPlan', () => {
  const prev = { ...process.env };
  beforeEach(() => {
    process.env.PLAY_SUB_CARE_PLUS_WEEKLY = 'care_plus_weekly';
    process.env.PLAY_SUB_CARE_PLUS_MONTHLY = 'care_plus_monthly';
    process.env.PLAY_SUB_CARE_PLUS_ANNUAL = 'care_plus_annual';
    process.env.PLAY_SUB_FAMILY_MONTHLY = 'family_monthly';
    process.env.PLAY_SUB_FAMILY_ANNUAL = 'family_annual';
  });
  afterAll(() => {
    process.env = prev;
  });

  it('maps care_plus_monthly', () => {
    expect(mapStoreProductIdToPlan('care_plus_monthly')).toEqual({
      planKey: 'care_plus',
      billingPeriod: 'monthly',
    });
  });

  it('maps care_plus_weekly', () => {
    expect(mapStoreProductIdToPlan('care_plus_weekly')).toEqual({
      planKey: 'care_plus',
      billingPeriod: 'weekly',
    });
  });

  it('maps Play base-plan id care_plus_weekly:weekly', () => {
    expect(mapStoreProductIdToPlan('care_plus_weekly:weekly')).toEqual({
      planKey: 'care_plus',
      billingPeriod: 'weekly',
    });
  });

  it('maps family_annual', () => {
    expect(mapStoreProductIdToPlan('family_annual')).toEqual({
      planKey: 'family',
      billingPeriod: 'annual',
    });
  });
});
