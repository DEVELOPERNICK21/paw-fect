import { mapLabelsToPetPhotoAnalysis } from '../petPhotoAnalysisMapping';

describe('mapLabelsToPetPhotoAnalysis', () => {
  it('maps clear dog labels to dog species without breed suggestions', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.92 },
      { label: 'Golden retriever', confidence: 0.84 },
      { label: 'Labrador retriever', confidence: 0.06 },
    ]);

    expect(result.species).toBe('dog');
    expect(result.lowConfidence).toBe(false);
    expect(result.breedSuggestions).toHaveLength(0);
    expect(result.quality).toBe('good');
  });

  it('maps clear cat labels to cat species without breed suggestions', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Cat', confidence: 0.91 },
      { label: 'Persian cat', confidence: 0.72 },
    ]);

    expect(result.species).toBe('cat');
    expect(result.breedSuggestions).toHaveLength(0);
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

  it('ignores generic animal labels like fur and pet for breed suggestions', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.97 },
      { label: 'Fur', confidence: 0.88 },
      { label: 'Pet', confidence: 0.81 },
      { label: 'Mammal', confidence: 0.76 },
      { label: 'Animal', confidence: 0.7 },
    ]);

    expect(result.species).toBe('dog');
    expect(result.breedSuggestions).toHaveLength(0);
  });

  it('uses known breed labels only to reinforce species, not as breed chips', () => {
    const result = mapLabelsToPetPhotoAnalysis([
      { label: 'Dog', confidence: 0.9 },
      { label: 'Persian cat', confidence: 0.8 },
      { label: 'Beagle', confidence: 0.65 },
    ]);

    expect(result.species).toBe('dog');
    expect(result.breedSuggestions).toHaveLength(0);
  });
});
