import type { Pet } from '../models/Pet';

export interface PawsitiveTip {
  title: string;
  body: string;
}

export function getPawsitiveTip(pet: Pet): PawsitiveTip {
  const breed = pet.breed?.toLowerCase().trim() ?? '';

  if (breed.includes('golden retriever') || breed === 'golden retriever' || breed.includes('golden')) {
    return {
      title: 'Pawsitive Tip',
      body: 'Golden Retrievers need regular dental stimulation. Try a pawsitive treat today!',
    };
  }

  return {
    title: 'Pawsitive Tip',
    body: 'Keep your routine consistent with gentle enrichment and regular checkups.',
  };
}

