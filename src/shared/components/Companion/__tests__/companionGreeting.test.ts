import { greetingLines, type GreetingKind } from '../companionGreeting';

const KINDS: GreetingKind[] = ['daily', 'welcomeBack', 'birthday'];

describe('greetingLines', () => {
  it('always gives a primary line and one alternate for a tap to reach', () => {
    for (const kind of KINDS) {
      for (const hour of [0, 6, 13, 19, 23]) {
        const lines = greetingLines(kind, { petName: 'Bruno', hour, daysAway: 4, age: 3 });
        expect(lines).toHaveLength(2);
        for (const line of lines) {
          expect(line.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('says the time of day for the daily hello', () => {
    expect(greetingLines('daily', { petName: 'Bruno', hour: 8 })[0]).toMatch(/Good morning/);
    expect(greetingLines('daily', { petName: 'Bruno', hour: 14 })[0]).toMatch(/Good afternoon/);
    expect(greetingLines('daily', { petName: 'Bruno', hour: 20 })[0]).toMatch(/Good evening/);
    expect(greetingLines('daily', { petName: 'Bruno', hour: 4 })[0]).toMatch(/Good evening/);
  });

  it('uses the pet name, and a neutral word when there is none', () => {
    expect(greetingLines('daily', { petName: 'Bruno', hour: 9 })[0]).toContain('Bruno');
    expect(greetingLines('daily', { petName: '   ', hour: 9 })[0]).toContain('your pet');
  });

  it('says the age on a birthday, singular and plural', () => {
    expect(greetingLines('birthday', { petName: 'Bruno', hour: 9, age: 1 })[0]).toContain('1 year old');
    expect(greetingLines('birthday', { petName: 'Bruno', hour: 9, age: 5 })[0]).toContain('5 years old');
    expect(greetingLines('birthday', { petName: 'Bruno', hour: 9 })[0]).toContain('Happy birthday, Bruno');
  });

  it('welcomes you back warmly, and after a long absence reassures instead of reproaching', () => {
    const short = greetingLines('welcomeBack', { petName: 'Bruno', hour: 9, daysAway: 4 });
    const long = greetingLines('welcomeBack', { petName: 'Bruno', hour: 9, daysAway: 12 });
    expect(short[0]).toMatch(/Welcome back/);
    expect(long[0]).toMatch(/kept Bruno's dates safe/);
    expect(long[1]).toMatch(/No rush/);
  });

  it('never guilts: no scolding or pressure words in any greeting', () => {
    const banned = /(neglect|forgot|forget|overdue|late|disappoint|sad|alone|should have|finally|missed (your|a) )/i;
    for (const kind of KINDS) {
      for (const hour of [3, 8, 15, 21]) {
        for (const daysAway of [3, 9, 40]) {
          for (const line of greetingLines(kind, { petName: 'Bruno', hour, daysAway, age: 2 })) {
            expect(line).not.toMatch(banned);
          }
        }
      }
    }
  });
});
