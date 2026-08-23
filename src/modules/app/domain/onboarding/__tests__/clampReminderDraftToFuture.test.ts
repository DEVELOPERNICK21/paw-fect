import { clampReminderDraftToFuture } from '../clampReminderDraftToFuture';
import type { ReminderDraft } from '../OnboardingDraft';

const pastWalkReminder = (
  date: string,
  time: string,
): ReminderDraft => ({
  kind: 'walk',
  title: "Milo's walk",
  date,
  time,
  repeat: 'daily',
  reminderType: 'other',
});

describe('clampReminderDraftToFuture', () => {
  const now = new Date('2026-08-23T15:30:00');

  it('returns draft unchanged when scheduled in the future', () => {
    const draft = pastWalkReminder('2026-08-24', '08:00');
    expect(clampReminderDraftToFuture(draft, now)).toBe(draft);
  });

  it('clamps past same-day reminder to a future datetime', () => {
    const draft = pastWalkReminder('2026-08-23', '08:00');
    const clamped = clampReminderDraftToFuture(draft, now);
    expect(clamped.date >= '2026-08-23').toBe(true);
    const scheduled = new Date(
      Number(clamped.date.slice(0, 4)),
      Number(clamped.date.slice(5, 7)) - 1,
      Number(clamped.date.slice(8, 10)),
      Number(clamped.time.slice(0, 2)),
      Number(clamped.time.slice(3, 5)),
    );
    expect(scheduled.getTime()).toBeGreaterThan(now.getTime());
  });
});
