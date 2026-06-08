import { PetCareLifecycleEngine } from '../PetCareLifecycleEngine';

describe('PetCareLifecycleEngine Crash Reproduction', () => {
  const engine = new PetCareLifecycleEngine();

  const baseInput = {
    userId: 'user-1',
    petId: 'pet-1',
    context: {
      petType: 'dog' as const,
      dateOfBirth: '2020-01-01',
      lifestyleType: 'indoor' as const,
      region: 'US' as const,
      nowDate: '2024-01-01',
    },
  };

  it('crashes when lastVaccinationDate is malformed', () => {
    // This should NOT crash the process with RangeError: Invalid time value
    // but in current implementation it likely will.
    expect(() => {
      engine.generateInitialPlan({
        ...baseInput,
        lastVaccinationDate: 'invalid-date',
      });
    }).not.toThrow(RangeError);
  });

  it('crashes when lastRabiesDate is malformed', () => {
    expect(() => {
      engine.generateInitialPlan({
        ...baseInput,
        lastRabiesDate: 'garbage',
      });
    }).not.toThrow(RangeError);
  });
});
