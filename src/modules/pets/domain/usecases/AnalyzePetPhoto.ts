import type {
  PetPhotoAnalyzer,
  PetPhotoAnalysis,
} from '../ports/PetPhotoAnalyzer';

export class AnalyzePetPhoto {
  constructor(private readonly analyzer: PetPhotoAnalyzer) {}

  async execute(localImageUri: string): Promise<PetPhotoAnalysis> {
    const trimmed = localImageUri.trim();
    if (trimmed.length === 0) {
      return emptyAnalysis();
    }
    try {
      return await this.analyzer.analyze(trimmed);
    } catch {
      return emptyAnalysis();
    }
  }
}

function emptyAnalysis(): PetPhotoAnalysis {
  return {
    species: 'unknown',
    speciesConfidence: 0,
    breedSuggestions: [],
    quality: 'poor',
    qualityHint: 'Try another photo — we could not analyze this one.',
    lowConfidence: true,
  };
}
