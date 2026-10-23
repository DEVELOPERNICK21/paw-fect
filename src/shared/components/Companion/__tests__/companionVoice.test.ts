import {
  companionLines,
  isStreakMilestone,
  STREAK_MILESTONES,
  whenPhrase,
} from '../companionVoice';

describe('companionLines', () => {
  it('always offers a primary line and an alternate', () => {
    const scenes = [
      { scene: 'home', mood: 'happy', petName: 'Milo', overdueCount: 0, hour: 9 },
      { scene: 'care', allGood: false, overdueCount: 0, remaining: 3 },
      { scene: 'health', petName: 'Milo', tone: 'ontrack', overdueCount: 0 },
      { scene: 'welcome', petName: 'Milo' },
    ] as const;
    for (const s of scenes) {
      const lines = companionLines(s);
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.every(l => l.trim().length > 0)).toBe(true);
    }
  });

  it('speaks to what is overdue without scolding', () => {
    const [line] = companionLines({
      scene: 'home',
      mood: 'nudge',
      petName: 'Milo',
      overdueCount: 1,
      hour: 9,
    });
    expect(line).toContain('A few things need a look for Milo');
    expect(line).not.toMatch(/late|fail|bad|overdue/i);
  });

  it('keeps the health line free of counts the summary card already shows', () => {
    const [line] = companionLines({
      scene: 'health',
      petName: 'Milo',
      tone: 'attention',
      overdueCount: 3,
    });
    expect(line).toBe('Let\'s get Milo back on track. Tap "I did this" as you finish each one.');
  });

  it('names the next item and when', () => {
    const [line] = companionLines({
      scene: 'home',
      mood: 'curious',
      petName: 'Milo',
      overdueCount: 0,
      nextLabel: 'Rabies booster',
      nextDays: 3,
      hour: 9,
    });
    expect(line).toBe("Rabies booster is coming up in 3 days. I'll remind you.");
  });

  it('greets by time of day', () => {
    const at = (hour: number): string =>
      companionLines({ scene: 'home', mood: 'happy', petName: 'Milo', overdueCount: 0, hour })[0];
    expect(at(8)).toContain('Good morning');
    expect(at(14)).toContain('Good afternoon');
    expect(at(20)).toContain('Good evening');
  });

  it('describes days naturally', () => {
    expect(whenPhrase(0)).toBe('today');
    expect(whenPhrase(1)).toBe('tomorrow');
    expect(whenPhrase(5)).toBe('in 5 days');
  });
});

describe('walk and level-up voice', () => {
  it('narrates the walk from start to treat', () => {
    const at = (done: number, total: number, streakDays = 0): string =>
      companionLines({ scene: 'walk', petName: 'Milo', done, total, streakDays })[0];
    expect(at(0, 5)).toContain("Let's go for today's walk");
    expect(at(3, 5)).toBe("2 stops to go. We're on our way!");
    expect(at(4, 5)).toBe("1 stop to go. We're on our way!");
    expect(at(5, 5)).toBe('We made it! Treat time for Milo.');
    expect(at(0, 0)).toContain('Nothing planned');
  });

  it('mentions the streak on arrival', () => {
    const lines = companionLines({ scene: 'walk', petName: 'Milo', done: 2, total: 2, streakDays: 4 });
    expect(lines[1]).toBe('4 days in a row. Wow.');
  });

  it('celebrates a level-up with its title', () => {
    const [line] = companionLines({ scene: 'levelup', level: 3, title: 'Trusty Pal', petName: 'Milo' });
    expect(line).toContain('Level 3');
    expect(line).toContain('Trusty Pals');
  });
});

describe('loading, empty, error and celebration voice', () => {
  const scenes = [
    { scene: 'loading', kind: 'splash' },
    { scene: 'loading', kind: 'savingFirstWin', petName: 'Milo' },
    { scene: 'loading', kind: 'records', petName: 'Milo' },
    ...(['pets', 'reminders', 'careTasks', 'dayNoPet', 'records', 'notifications'] as const).map(
      kind => ({ scene: 'empty', kind, petName: 'Milo' }) as const,
    ),
    ...(['savingFirstWin', 'records', 'reminders'] as const).map(
      kind => ({ scene: 'error', kind, petName: 'Milo' }) as const,
    ),
    { scene: 'saved', kind: 'reminder', petName: 'Milo' },
    { scene: 'streak', days: 7, petName: 'Milo' },
    { scene: 'onboarding', step: 'welcome' },
    { scene: 'onboarding', step: 'firstReminder', petName: 'Milo' },
  ] as const;

  it.each(scenes)('has a primary line and an alternate for %o', scene => {
    const lines = companionLines(scene);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.every(l => l.trim().length > 0)).toBe(true);
  });

  it('never blames the user when something fails', () => {
    for (const kind of ['savingFirstWin', 'records', 'reminders'] as const) {
      for (const line of companionLines({ scene: 'error', kind, petName: 'Milo' })) {
        expect(line).not.toMatch(/your fault|you failed|wrong|error/i);
      }
    }
  });

  it('falls back to "your pet" when there is no name', () => {
    expect(companionLines({ scene: 'empty', kind: 'records' })[0]).toContain('your pet');
    expect(companionLines({ scene: 'loading', kind: 'savingFirstWin', petName: '  ' })[0]).toBe(
      "Saving your pet's reminder...",
    );
  });

  it('greets the named pet on the first reminder step', () => {
    expect(companionLines({ scene: 'onboarding', step: 'firstReminder', petName: 'Milo' })[0]).toContain(
      'Nice to meet Milo!',
    );
  });

  it('celebrates streaks only at milestones', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 14, 30, 60, 100]);
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(8)).toBe(false);
    expect(companionLines({ scene: 'streak', days: 30, petName: 'Milo' })[0]).toBe(
      '30 days in a row! Milo has the best human.',
    );
  });
});
