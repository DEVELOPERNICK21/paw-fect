import { AnalyzePetPhoto } from '../AnalyzePetPhoto';
import type {
  PetPhotoAnalyzer,
  PetPhotoAnalysis,
} from '../../ports/PetPhotoAnalyzer';

const analysis: PetPhotoAnalysis = {
  species: 'dog',
  speciesConfidence: 0.9,
  breedSuggestions: [{ label: 'Golden Retriever', confidence: 0.8 }],
  quality: 'good',
  qualityHint: 'Good for profile photo',
  lowConfidence: false,
};

const fakeAnalyzer: PetPhotoAnalyzer = {
  analyze: jest.fn(async () => analysis),
};

describe('AnalyzePetPhoto', () => {
  it('returns analyzer result for valid uri', async () => {
    const useCase = new AnalyzePetPhoto(fakeAnalyzer);
    const result = await useCase.execute('file:///photo.jpg');
    expect(result).toEqual(analysis);
  });

  it('returns safe fallback when analyzer throws', async () => {
    const failing: PetPhotoAnalyzer = {
      analyze: jest.fn(async () => {
        throw new Error('ml failed');
      }),
    };
    const useCase = new AnalyzePetPhoto(failing);
    const result = await useCase.execute('file:///photo.jpg');
    expect(result.species).toBe('unknown');
    expect(result.lowConfidence).toBe(true);
    expect(result.quality).toBe('poor');
  });
});
