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
const BREED_LABEL_MAP: Record<string, string> = {
  'golden retriever': 'Golden Retriever',
  'labrador retriever': 'Labrador Retriever',
  labrador: 'Labrador Retriever',
  'german shepherd': 'German Shepherd',
  'german shepherd dog': 'German Shepherd',
  beagle: 'Beagle',
  pug: 'Pug',
  bulldog: 'Bulldog',
  'french bulldog': 'French Bulldog',
  poodle: 'Poodle',
  'toy poodle': 'Poodle',
  'standard poodle': 'Poodle',
  'miniature poodle': 'Poodle',
  husky: 'Siberian Husky',
  'siberian husky': 'Siberian Husky',
  'border collie': 'Border Collie',
  'cocker spaniel': 'Cocker Spaniel',
  'english cocker spaniel': 'Cocker Spaniel',
  dachshund: 'Dachshund',
  'yorkshire terrier': 'Yorkshire Terrier',
  boxer: 'Boxer',
  rottweiler: 'Rottweiler',
  'shih tzu': 'Shih Tzu',
  chihuahua: 'Chihuahua',
  'great dane': 'Great Dane',
  doberman: 'Doberman',
  'doberman pinscher': 'Doberman',
  malamute: 'Alaskan Malamute',
  'alaskan malamute': 'Alaskan Malamute',
  'australian shepherd': 'Australian Shepherd',
  corgi: 'Corgi',
  'pembroke welsh corgi': 'Corgi',
  'cardigan welsh corgi': 'Corgi',
  'jack russell terrier': 'Jack Russell Terrier',
  'cavalier king charles spaniel': 'Cavalier King Charles Spaniel',
  'basset hound': 'Basset Hound',
  dalmatian: 'Dalmatian',
  'saint bernard': 'Saint Bernard',
  'bull terrier': 'Bull Terrier',
  'staffordshire bull terrier': 'Staffordshire Bull Terrier',
  'american staffordshire terrier': 'American Staffordshire Terrier',
  'persian cat': 'Persian',
  persian: 'Persian',
  'siamese cat': 'Siamese',
  siamese: 'Siamese',
  'maine coon': 'Maine Coon',
  'british shorthair': 'British Shorthair',
  'american shorthair': 'American Shorthair',
  ragdoll: 'Ragdoll',
  bengal: 'Bengal',
  'bengal cat': 'Bengal',
  sphynx: 'Sphynx',
  'scottish fold': 'Scottish Fold',
  abyssinian: 'Abyssinian',
  'russian blue': 'Russian Blue',
  'norwegian forest cat': 'Norwegian Forest Cat',
  birman: 'Birman',
  'oriental shorthair': 'Oriental Shorthair',
  'exotic shorthair': 'Exotic Shorthair',
  himalayan: 'Himalayan',
  'himalayan cat': 'Himalayan',
  burmese: 'Burmese',
  'burmese cat': 'Burmese',
  'manx cat': 'Manx',
  manx: 'Manx',
};

export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function titleCaseLabel(label: string): string {
  return label
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    // Breed map includes both dog and cat breeds — infer from key
    if (key.includes('cat') || isCatBreedKey(key)) {
      cat = Math.max(cat, confidence);
    } else {
      dog = Math.max(dog, confidence);
    }
  }

  return { dog, cat };
}

const CAT_BREED_KEYS = new Set([
  'persian',
  'siamese',
  'maine coon',
  'british shorthair',
  'american shorthair',
  'ragdoll',
  'bengal',
  'sphynx',
  'scottish fold',
  'abyssinian',
  'russian blue',
  'norwegian forest cat',
  'birman',
  'oriental shorthair',
  'exotic shorthair',
  'himalayan',
  'burmese',
  'manx',
]);

function isCatBreedKey(key: string): boolean {
  if (key.includes('cat')) {
    return true;
  }
  return CAT_BREED_KEYS.has(key);
}

export function pickBreedSuggestions(
  labels: RawImageLabel[],
): PetPhotoBreedSuggestion[] {
  const byBreed = new Map<string, number>();

  for (const entry of labels) {
    const key = normalizeLabel(entry.label);
    const confidence = clampConfidence(entry.confidence);
    const mapped = BREED_LABEL_MAP[key];
    if (mapped != null) {
      byBreed.set(mapped, Math.max(byBreed.get(mapped) ?? 0, confidence));
      continue;
    }
    // Unmapped high-confidence breed-like labels (best guess)
    if (
      confidence >= 0.5 &&
      !DOG_LABELS.has(key) &&
      !CAT_LABELS.has(key) &&
      !isNonPetLabel(key)
    ) {
      const guess = `${titleCaseLabel(key)} (best guess)`;
      byBreed.set(guess, Math.max(byBreed.get(guess) ?? 0, confidence));
    }
  }

  return [...byBreed.entries()]
    .map(([label, confidence]) => ({ label, confidence }))
    .sort((a, b) => b.confidence - a.confidence || a.label.localeCompare(b.label))
    .slice(0, MAX_BREED_SUGGESTIONS);
}

function isNonPetLabel(key: string): boolean {
  return (
    key === 'person' ||
    key === 'people' ||
    key === 'human' ||
    key === 'food' ||
    key === 'furniture' ||
    key === 'car' ||
    key === 'building'
  );
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

  const breedSuggestions =
    species === 'unknown' ? [] : pickBreedSuggestions(labels);

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
