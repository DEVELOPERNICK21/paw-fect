export type PetFormProgressInput = {
  nameFilled: boolean;
  dobFilled: boolean;
  genderFilled: boolean;
  breedFilled: boolean;
  photoFilled: boolean;
  healthAnswered: boolean;
  /** Smart defaults already applied (species, lifestyle, region). */
  defaultsApplied: number;
};

export type PetFormProgress = {
  filled: number;
  total: number;
  percent: number;
};

const TOTAL_WEIGHT = 10;

/**
 * Goal-gradient progress: smart defaults count as already earned so the bar
 * starts partially filled (people finish what they have started).
 */
export function computePetFormProgress(
  input: PetFormProgressInput,
): PetFormProgress {
  let filled = input.defaultsApplied;
  if (input.nameFilled) filled += 1;
  if (input.dobFilled) filled += 2;
  if (input.genderFilled) filled += 1;
  if (input.breedFilled) filled += 1;
  if (input.photoFilled) filled += 1;
  if (input.healthAnswered) filled += 2;
  filled = Math.min(TOTAL_WEIGHT, filled);
  return {
    filled,
    total: TOTAL_WEIGHT,
    percent: Math.round((filled / TOTAL_WEIGHT) * 100),
  };
}
