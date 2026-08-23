import {
  addDaysLocalIsoDate,
  buildReminderDraftDefaults,
  toLocalIsoDate,
} from '../buildReminderDraftDefaults';

describe('buildReminderDraftDefaults', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  it('builds daily walk for tomorrow 08:00 as other', () => {
    const d = buildReminderDraftDefaults('walk', 'Milo', now);
    expect(d.kind).toBe('walk');
    expect(d.reminderType).toBe('other');
    expect(d.repeat).toBe('daily');
    expect(d.time).toBe('08:00');
    expect(d.title).toBe("Milo's walk");
    expect(d.date).toBe(addDaysLocalIsoDate(now, 1));
  });

  it('builds vaccination ~28 days out yearly', () => {
    const d = buildReminderDraftDefaults('vaccination', 'Milo', now);
    expect(d.kind).toBe('vaccination');
    expect(d.reminderType).toBe('vaccination');
    expect(d.repeat).toBe('yearly');
    expect(d.time).toBe('09:00');
    expect(d.date).toBe(addDaysLocalIsoDate(now, 28));
    expect(d.title).toBe("Milo's vaccination");
  });

  it('builds medication for tomorrow 08:00 once', () => {
    const d = buildReminderDraftDefaults('medication', 'Milo', now);
    expect(d.kind).toBe('medication');
    expect(d.reminderType).toBe('medication');
    expect(d.repeat).toBe('once');
    expect(d.time).toBe('08:00');
    expect(d.date).toBe(addDaysLocalIsoDate(now, 1));
    expect(d.title).toBe("Milo's medication");
  });

  it('builds checkup ~1 year out yearly', () => {
    const d = buildReminderDraftDefaults('checkup', 'Milo', now);
    expect(d.kind).toBe('checkup');
    expect(d.reminderType).toBe('checkup');
    expect(d.repeat).toBe('yearly');
    expect(d.time).toBe('09:00');
    expect(d.date).toBe(addDaysLocalIsoDate(now, 365));
    expect(d.title).toBe("Milo's checkup");
  });

  it('toLocalIsoDate formats in local timezone', () => {
    expect(toLocalIsoDate(now)).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    );
  });
});
