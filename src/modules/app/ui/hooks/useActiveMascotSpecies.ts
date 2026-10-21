import { usePetStore } from '../../../pets/store/petStore';
import type { MascotSpecies } from '../../../../shared/components/Mascot/mascotTypes';
import { mascotSpeciesFor } from '../../domain/mascot/mascotMood';

/** Mascot species that matches the active pet (dog until a pet exists). */
export function useActiveMascotSpecies(): MascotSpecies {
  const type = usePetStore(state => state.activePet?.type);
  return mascotSpeciesFor(type);
}
