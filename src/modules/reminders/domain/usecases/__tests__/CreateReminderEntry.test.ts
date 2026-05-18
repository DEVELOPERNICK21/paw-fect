import { CreateReminderEntry } from '../CreateReminderEntry';

describe('CreateReminderEntry', () => {
  const base = {
    petId: 'p1',
    title: ' Test ',
    type: 'other' as const,
    date: '2030-01-01',
    time: '10:00',
    repeatEnabled: false,
  };

  it('stores trimmed notes', () => {
    const uc = new CreateReminderEntry();
    const r = uc.execute({ ...base, notes: '  hello  ' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.reminder.notes).toBe('hello');
    }
  });

  it('defaults notes to empty when omitted', () => {
    const uc = new CreateReminderEntry();
    const r = uc.execute(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.reminder.notes).toBe('');
    }
  });
});
