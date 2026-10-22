import {
  INITIAL_HEALTH_RECORD_OPEN_STATE,
  mascotReactionForRecordOpen,
  stepHealthRecordOpen,
  type HealthRecordOpenState,
} from '../recordMascotReactions';

const run = (
  steps: Array<{ focused: boolean; petId: string | null }>,
): { requests: string[]; state: HealthRecordOpenState } => {
  let state = INITIAL_HEALTH_RECORD_OPEN_STATE;
  const requests: string[] = [];
  for (const input of steps) {
    const step = stepHealthRecordOpen(state, input);
    state = step.state;
    if (step.request) {
      expect(step.request.reaction).toBe('curious');
      requests.push(String(step.request.id));
    }
  }
  return { requests, state };
};

describe('mascotReactionForRecordOpen', () => {
  it('opening a record is curious', () => {
    expect(mascotReactionForRecordOpen()).toBe('curious');
  });
});

describe('stepHealthRecordOpen', () => {
  it('announces once when the screen gains focus with a pet', () => {
    const { requests } = run([{ focused: true, petId: 'p1' }]);
    expect(requests).toEqual(['health-record-open:p1:1']);
  });

  it('does not announce again on repeated renders of the same focus', () => {
    const { requests } = run([
      { focused: true, petId: 'p1' },
      { focused: true, petId: 'p1' },
      { focused: true, petId: 'p1' },
    ]);
    expect(requests).toHaveLength(1);
  });

  it('announces again each time the user comes back to the screen', () => {
    const { requests } = run([
      { focused: true, petId: 'p1' },
      { focused: false, petId: 'p1' },
      { focused: true, petId: 'p1' },
    ]);
    expect(requests).toEqual(['health-record-open:p1:1', 'health-record-open:p1:2']);
  });

  it('never announces while unfocused', () => {
    expect(run([{ focused: false, petId: 'p1' }]).requests).toHaveLength(0);
  });

  it('waits for a pet, then announces when one arrives during the same focus', () => {
    const { requests } = run([
      { focused: true, petId: null },
      { focused: true, petId: 'p1' },
    ]);
    expect(requests).toEqual(['health-record-open:p1:1']);
  });

  it('announces again if the pet being shown changes while focused', () => {
    const { requests } = run([
      { focused: true, petId: 'p1' },
      { focused: true, petId: 'p2' },
    ]);
    expect(requests).toEqual(['health-record-open:p1:1', 'health-record-open:p2:2']);
  });

  it('gives every request a distinct id', () => {
    const { requests } = run([
      { focused: true, petId: 'p1' },
      { focused: false, petId: 'p1' },
      { focused: true, petId: 'p1' },
      { focused: false, petId: 'p1' },
      { focused: true, petId: 'p1' },
    ]);
    expect(new Set(requests).size).toBe(requests.length);
  });
});
