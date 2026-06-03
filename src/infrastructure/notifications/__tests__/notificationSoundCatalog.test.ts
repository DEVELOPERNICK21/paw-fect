import {
  attentionTierFromHealthSlot,
  attentionTierFromReminderLead,
  attentionTierFromScheduleLead,
  toneFromCareCategory,
  toneFromDailyRoutine,
} from '../notificationSoundCatalog';

describe('notificationSoundCatalog', () => {
  it('maps care categories to tones', () => {
    expect(toneFromCareCategory('feeding')).toBe('meal');
    expect(toneFromCareCategory('walk')).toBe('active');
    expect(toneFromCareCategory('medication')).toBe('health');
    expect(toneFromCareCategory('grooming')).toBe('care');
  });

  it('maps daily routines to tones', () => {
    expect(toneFromDailyRoutine('feed')).toBe('meal');
    expect(toneFromDailyRoutine('walk')).toBe('active');
    expect(toneFromDailyRoutine('groom')).toBe('care');
  });

  it('maps reminder lead times to attention tiers', () => {
    expect(attentionTierFromReminderLead('24h')).toBe('soft');
    expect(attentionTierFromReminderLead('1h')).toBe('standard');
    expect(attentionTierFromReminderLead('due')).toBe('urgent');
  });

  it('maps health slots to attention tiers', () => {
    expect(attentionTierFromHealthSlot('d2')).toBe('soft');
    expect(attentionTierFromHealthSlot('due')).toBe('standard');
    expect(attentionTierFromHealthSlot('overdue')).toBe('urgent');
  });

  it('maps schedule lead minutes to attention tiers', () => {
    expect(attentionTierFromScheduleLead(90)).toBe('soft');
    expect(attentionTierFromScheduleLead(30)).toBe('standard');
    expect(attentionTierFromScheduleLead(0)).toBe('urgent');
  });
});
