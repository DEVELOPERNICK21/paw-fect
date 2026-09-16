export type PetPhotoQuality = 'good' | 'fair' | 'poor';
export type PetPhotoSpecies = 'dog' | 'cat' | 'unknown';

export type RawImageLabel = {
  label: string;
  confidence: number;
};

export type PetPhotoBreedSuggestion = {
  label: string;
  confidence: number;
};

export type PetPhotoAnalysis = {
  species: PetPhotoSpecies;
  speciesConfidence: number;
  breedSuggestions: PetPhotoBreedSuggestion[];
  quality: PetPhotoQuality;
  qualityHint: string;
  lowConfidence: boolean;
  rawLabels?: RawImageLabel[];
};

export interface PetPhotoAnalyzer {
  analyze(localImageUri: string): Promise<PetPhotoAnalysis>;
}
