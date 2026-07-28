import { computePetFormProgress } from '../../../domain/utils/computePetFormProgress';

describe('computePetFormProgress', () => {
  it('starts partially filled from smart defaults (goal gradient)', () => {
    const result = computePetFormProgress({
      nameFilled: false,
      dobFilled: false,
      genderFilled: false,
      breedFilled: false,
      photoFilled: false,
      healthAnswered: false,
      defaultsApplied: 4,
    });
    expect(result.percent).toBe(40);
    expect(result.filled).toBe(4);
  });

  it('increases when the user locks in details', () => {
    const result = computePetFormProgress({
      nameFilled: true,
      dobFilled: true,
      genderFilled: true,
      breedFilled: false,
      photoFilled: false,
      healthAnswered: false,
      defaultsApplied: 4,
    });
    expect(result.percent).toBe(80);
  });
});
