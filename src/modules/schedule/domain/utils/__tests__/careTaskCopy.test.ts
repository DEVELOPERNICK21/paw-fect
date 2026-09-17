import {
  careTaskActionLabel,
  careTaskShortVerb,
  careTaskSubtitle,
} from '../careTaskCopy';

describe('careTaskCopy', () => {
  it('builds clear action labels with pet name', () => {
    expect(
      careTaskActionLabel({ category: 'feeding', title: 'Breakfast' }, 'Bruno'),
    ).toBe('Feed Bruno');
    expect(
      careTaskActionLabel({ category: 'walk', title: 'Evening walk' }, 'Bruno'),
    ).toBe('Walk Bruno');
    expect(
      careTaskActionLabel({ category: 'play', title: 'Play' }, 'Luna'),
    ).toBe('Play with Luna');
  });

  it('uses short verbs for lists', () => {
    expect(careTaskShortVerb({ category: 'feeding', title: 'Breakfast' })).toBe(
      'Feed',
    );
    expect(careTaskShortVerb({ category: 'walk', title: 'Walk' })).toBe('Walk');
  });

  it('keeps engine title as subtitle', () => {
    expect(
      careTaskSubtitle({ category: 'feeding', title: 'Breakfast' }),
    ).toBe('Breakfast');
  });
});
