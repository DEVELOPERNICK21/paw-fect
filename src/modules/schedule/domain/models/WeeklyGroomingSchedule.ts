import type { PetSpecies } from './PetProfile';

export interface WeeklyGroomingBlock {
  petId: string;
  weekday: number;
  task: string;
  species: PetSpecies;
  reminderTime: string;
}
