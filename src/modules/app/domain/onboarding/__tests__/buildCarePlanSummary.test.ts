import { buildCarePlanSummary } from '../buildCarePlanSummary';
import {
  createDefaultOnboardingDraft,
  setCareInterests,
  setGoal,
  setPetDraft,
  setProblems,
} from '../onboardingDraftReducers';

describe('buildCarePlanSummary', () => {
  it('uses nickname in title and paywall headline', () => {
    let d = createDefaultOnboardingDraft();
    d = setPetDraft(d, { species: 'dog', ageBand: 'adult', nickname: 'Luna' });
    d = setGoal(d, 'never_miss_care');
    d = setProblems(d, ['missed_vaccines']);
    d = setCareInterests(d, ['vaccines', 'walks']);
    const s = buildCarePlanSummary(d);
    expect(s.title).toMatch(/Luna/);
    expect(s.paywallHeadline).toMatch(/Luna/);
    expect(s.bullets.length).toBeGreaterThan(0);
    expect(s.tip.length).toBeGreaterThan(0);
  });

  it('falls back when nickname missing', () => {
    const s = buildCarePlanSummary(createDefaultOnboardingDraft());
    expect(s.title).toMatch(/your pet/i);
  });
});
