import { mapLabelsToPetPhotoAnalysis } from '../petPhotoAnalysisMapping';

describe('mapLabelsToPetPhotoAnalysis', () => {
  it('maps clear dog labels to dog species with breed suggestions', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.92 },
      { label: 'Golden retriever', confidence: 0.84 },
      { label: 'Labrador retriever', confidence: 0.06 },
    ]);

    expect(result.species).toBe('dog');
    expect(result.lowConfidence).toBe(false);
    expect(result.breedSuggestions[0]?.label).toBe('Golden Retriever');
    expect(result.quality).toBe('good');
  });

  it('maps clear cat labels to cat species', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Cat', confidence: 0.91 },
      { label: 'Persian cat', confidence: 0.72 },
    ]);

    expect(result.species).toBe('cat');
    expect(result.breedSuggestions[0]?.label).toBe('Persian');
  });

  it('flags low confidence when dog and cat scores are close', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.52 },
      { label: 'Cat', confidence: 0.48 },
    ]);

    expect(result.lowConfidence).toBe(true);
    expect(result.species).toBe('dog');
  });

  it('returns unknown species and poor quality for non-pet labels', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Person', confidence: 0.95 },
      { label: 'Food', confidence: 0.4 },
    ]);

    expect(result.species).toBe('unknown');
    expect(result.quality).toBe('poor');
    expect(result.breedSuggestions).toHaveLength(0);
  });
});
