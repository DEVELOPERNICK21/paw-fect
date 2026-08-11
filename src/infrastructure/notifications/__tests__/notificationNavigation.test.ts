import { getNotificationNavigationTarget } from '../getNotificationNavigationTarget';

describe('getNotificationNavigationTarget', () => {
  it('returns reminderDetail when reminderId is present', () => {
    expect(
      getNotificationNavigationTarget({
        reminderId: 'r1',
        kind: 'reminder',
        petId: 'p1',
      }),
    ).toEqual({ target: 'reminderDetail', reminderId: 'r1' });
  });

  it('returns healthRecords with focusRecordId and petId for smartHealth', () => {
    expect(
      getNotificationNavigationTarget({
        kind: 'smartHealth',
        recordId: 'rec1',
        petId: 'p1',
      }),
    ).toEqual({ target: 'healthRecords', focusRecordId: 'rec1', petId: 'p1' });
  });

  it('ignores recordId without smartHealth kind', () => {
    expect(getNotificationNavigationTarget({ recordId: 'rec1' })).toBeNull();
  });

  it('returns wellnessHub for dailySchedule with petId', () => {
    expect(
      getNotificationNavigationTarget({
        kind: 'dailySchedule',
        petId: 'p1',
        blockId: 'b1',
      }),
    ).toEqual({ target: 'wellnessHub', petId: 'p1', blockId: 'b1' });
  });

  it('returns petProfile for dailyRoutine', () => {
    expect(
      getNotificationNavigationTarget({ kind: 'dailyRoutine', petId: 'p1' }),
    ).toEqual({ target: 'petProfile' });
  });

  it('returns home for loginWelcome', () => {
    expect(getNotificationNavigationTarget({ kind: 'loginWelcome' })).toEqual({
      target: 'home',
    });
  });

  it('returns null for empty or missing data', () => {
    expect(getNotificationNavigationTarget({})).toBeNull();
    expect(getNotificationNavigationTarget(null)).toBeNull();
    expect(getNotificationNavigationTarget(undefined)).toBeNull();
  });
});
