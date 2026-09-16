import type {
  PetPhotoAnalysis,
  PetPhotoBreedSuggestion,
  PetPhotoQuality,
  PetPhotoSpecies,
  RawImageLabel,
} from '../ports/PetPhotoAnalyzer';

export const SPECIES_LOW_CONFIDENCE_THRESHOLD = 0.55;
export const SPECIES_TIE_DELTA = 0.15;
export const MAX_BREED_SUGGESTIONS = 3;

const DOG_LABELS = new Set([
  'dog',
  'puppy',
  'canine',
  'dogs',
  'puppies',
]);

const CAT_LABELS = new Set([
  'cat',
  'kitten',
  'feline',
  'cats',
  'kittens',
]);

/** ML Kit / ImageNet-style label → display breed name */
const BREED_LABEL_MAP: Record<string, { display: string; species: 'dog' | 'cat' }> =
  {
    'golden retriever': { display: 'Golden Retriever', species: 'dog' },
    'labrador retriever': { display: 'Labrador Retriever', species: 'dog' },
    labrador: { display: 'Labrador Retriever', species: 'dog' },
    'german shepherd': { display: 'German Shepherd', species: 'dog' },
    'german shepherd dog': { display: 'German Shepherd', species: 'dog' },
    beagle: { display: 'Beagle', species: 'dog' },
    pug: { display: 'Pug', species: 'dog' },
    bulldog: { display: 'Bulldog', species: 'dog' },
    'french bulldog': { display: 'French Bulldog', species: 'dog' },
    poodle: { display: 'Poodle', species: 'dog' },
    'toy poodle': { display: 'Poodle', species: 'dog' },
    'standard poodle': { display: 'Poodle', species: 'dog' },
    'miniature poodle': { display: 'Poodle', species: 'dog' },
    husky: { display: 'Siberian Husky', species: 'dog' },
    'siberian husky': { display: 'Siberian Husky', species: 'dog' },
    'border collie': { display: 'Border Collie', species: 'dog' },
    'cocker spaniel': { display: 'Cocker Spaniel', species: 'dog' },
    'english cocker spaniel': { display: 'Cocker Spaniel', species: 'dog' },
    dachshund: { display: 'Dachshund', species: 'dog' },
    'yorkshire terrier': { display: 'Yorkshire Terrier', species: 'dog' },
    boxer: { display: 'Boxer', species: 'dog' },
    rottweiler: { display: 'Rottweiler', species: 'dog' },
    'shih tzu': { display: 'Shih Tzu', species: 'dog' },
    chihuahua: { display: 'Chihuahua', species: 'dog' },
    'great dane': { display: 'Great Dane', species: 'dog' },
    doberman: { display: 'Doberman', species: 'dog' },
    'doberman pinscher': { display: 'Doberman', species: 'dog' },
    malamute: { display: 'Alaskan Malamute', species: 'dog' },
    'alaskan malamute': { display: 'Alaskan Malamute', species: 'dog' },
    'australian shepherd': { display: 'Australian Shepherd', species: 'dog' },
    corgi: { display: 'Corgi', species: 'dog' },
    'pembroke welsh corgi': { display: 'Corgi', species: 'dog' },
    'cardigan welsh corgi': { display: 'Corgi', species: 'dog' },
    'jack russell terrier': { display: 'Jack Russell Terrier', species: 'dog' },
    'cavalier king charles spaniel': {
      display: 'Cavalier King Charles Spaniel',
      species: 'dog',
    },
    'basset hound': { display: 'Basset Hound', species: 'dog' },
    dalmatian: { display: 'Dalmatian', species: 'dog' },
    'saint bernard': { display: 'Saint Bernard', species: 'dog' },
    'bull terrier': { display: 'Bull Terrier', species: 'dog' },
    'staffordshire bull terrier': {
      display: 'Staffordshire Bull Terrier',
      species: 'dog',
    },
    'american staffordshire terrier': {
      display: 'American Staffordshire Terrier',
      species: 'dog',
    },
    'indian pariah dog': { display: 'Indie / Pariah Dog', species: 'dog' },
    'pariah dog': { display: 'Indie / Pariah Dog', species: 'dog' },
    indie: { display: 'Indie / Pariah Dog', species: 'dog' },
    'street dog': { display: 'Indie / Pariah Dog', species: 'dog' },
    'mixed breed': { display: 'Mixed breed', species: 'dog' },
    mongrel: { display: 'Mixed breed', species: 'dog' },
    'persian cat': { display: 'Persian', species: 'cat' },
    persian: { display: 'Persian', species: 'cat' },
    'siamese cat': { display: 'Siamese', species: 'cat' },
    siamese: { display: 'Siamese', species: 'cat' },
    'maine coon': { display: 'Maine Coon', species: 'cat' },
    'british shorthair': { display: 'British Shorthair', species: 'cat' },
    'american shorthair': { display: 'American Shorthair', species: 'cat' },
    ragdoll: { display: 'Ragdoll', species: 'cat' },
    bengal: { display: 'Bengal', species: 'cat' },
    'bengal cat': { display: 'Bengal', species: 'cat' },
    sphynx: { display: 'Sphynx', species: 'cat' },
    'scottish fold': { display: 'Scottish Fold', species: 'cat' },
    abyssinian: { display: 'Abyssinian', species: 'cat' },
    'russian blue': { display: 'Russian Blue', species: 'cat' },
    'norwegian forest cat': { display: 'Norwegian Forest Cat', species: 'cat' },
    birman: { display: 'Birman', species: 'cat' },
    'oriental shorthair': { display: 'Oriental Shorthair', species: 'cat' },
    'exotic shorthair': { display: 'Exotic Shorthair', species: 'cat' },
    himalayan: { display: 'Himalayan', species: 'cat' },
    'himalayan cat': { display: 'Himalayan', species: 'cat' },
    burmese: { display: 'Burmese', species: 'cat' },
    'burmese cat': { display: 'Burmese', species: 'cat' },
    'manx cat': { display: 'Manx', species: 'cat' },
    manx: { display: 'Manx', species: 'cat' },
  };

export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

type SpeciesScores = {
  dog: number;
  cat: number;
};

export function scoreSpecies(labels: RawImageLabel[]): SpeciesScores {
  let dog = 0;
  let cat = 0;

  for (const entry of labels) {
    const key = normalizeLabel(entry.label);
    const confidence = clampConfidence(entry.confidence);

    if (DOG_LABELS.has(key)) {
      dog = Math.max(dog, confidence);
      continue;
    }
    if (CAT_LABELS.has(key)) {
      cat = Math.max(cat, confidence);
      continue;
    }

    const breed = BREED_LABEL_MAP[key];
    if (breed == null) {
      continue;
    }
    if (breed.species === 'cat') {
      cat = Math.max(cat, confidence);
    } else {
      dog = Math.max(dog, confidence);
    }
  }

  return { dog, cat };
}

/**
 * Only allowlisted breed labels become suggestions.
 * Generic ML Kit labels (fur, pet, mammal, animal, …) are never breeds.
 */
export function pickBreedSuggestions(
  labels: RawImageLabel[],
  species: PetPhotoSpecies,
): PetPhotoBreedSuggestion[] {
  if (species !== 'dog' && species !== 'cat') {
    return [];
  }

  const byBreed = new Map<string, number>();

  for (const entry of labels) {
    const key = normalizeLabel(entry.label);
    const confidence = clampConfidence(entry.confidence);
    const mapped = BREED_LABEL_MAP[key];
    if (mapped == null || mapped.species !== species) {
      continue;
    }
    byBreed.set(
      mapped.display,
      Math.max(byBreed.get(mapped.display) ?? 0, confidence),
    );
  }

  return [...byBreed.entries()]
    .map(([label, confidence]) => ({ label, confidence }))
    .sort(
      (a, b) =>
        b.confidence - a.confidence || a.label.localeCompare(b.label),
    )
    .slice(0, MAX_BREED_SUGGESTIONS);
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function deriveQuality(
  species: PetPhotoSpecies,
  speciesConfidence: number,
): { quality: PetPhotoQuality; qualityHint: string } {
  if (species === 'unknown' || speciesConfidence < 0.4) {
    return {
      quality: 'poor',
      qualityHint: "Try another photo — we're not sure this is your pet",
    };
  }
  if (speciesConfidence < SPECIES_LOW_CONFIDENCE_THRESHOLD) {
    return {
      quality: 'fair',
      qualityHint: 'Usable, but a clearer photo is better',
    };
  }
  return {
    quality: 'good',
    qualityHint: 'Good for profile photo',
  };
}

export function mapLabelsToPetPhotoAnalysis(
  labels: RawImageLabel[],
): PetPhotoAnalysis {
  const scores = scoreSpecies(labels);
  let species: PetPhotoSpecies = 'unknown';
  let speciesConfidence = 0;

  if (scores.dog > 0 || scores.cat > 0) {
    if (scores.dog >= scores.cat) {
      species = 'dog';
      speciesConfidence = scores.dog;
    } else {
      species = 'cat';
      speciesConfidence = scores.cat;
    }
  }

  const lowConfidence =
    species === 'unknown' ||
    speciesConfidence < SPECIES_LOW_CONFIDENCE_THRESHOLD ||
    Math.abs(scores.dog - scores.cat) <= SPECIES_TIE_DELTA;

  const breedSuggestions = pickBreedSuggestions(labels, species);

  const { quality, qualityHint } = deriveQuality(species, speciesConfidence);

  return {
    species,
    speciesConfidence,
    breedSuggestions,
    quality,
    qualityHint,
    lowConfidence,
  };
}
