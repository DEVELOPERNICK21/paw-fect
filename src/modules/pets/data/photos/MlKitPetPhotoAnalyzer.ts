import ImageLabeling from '@react-native-ml-kit/image-labeling';

import type { PetPhotoAnalyzer } from '../../domain/ports/PetPhotoAnalyzer';
import { mapLabelsToPetPhotoAnalysis } from '../../domain/utils/petPhotoAnalysisMapping';

export function createMlKitPetPhotoAnalyzer(): PetPhotoAnalyzer {
  return {
    async analyze(localImageUri) {
      const labels = await ImageLabeling.label(localImageUri);
      const normalized = labels.map(row => ({
        label: row.text,
        confidence: row.confidence,
      }));
      const analysis = mapLabelsToPetPhotoAnalysis(normalized);
      return { ...analysis, rawLabels: normalized };
    },
  };
}
