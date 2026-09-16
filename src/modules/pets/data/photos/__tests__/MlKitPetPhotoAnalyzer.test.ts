jest.mock('@react-native-ml-kit/image-labeling', () => ({
  __esModule: true,
  default: {
    label: jest.fn(),
  },
}));

import ImageLabeling from '@react-native-ml-kit/image-labeling';

import { createMlKitPetPhotoAnalyzer } from '../MlKitPetPhotoAnalyzer';

describe('MlKitPetPhotoAnalyzer', () => {
  it('maps ML Kit labels through domain mapping', async () => {
    (ImageLabeling.label as jest.Mock).mockResolvedValueOnce([
      { text: 'Dog', confidence: 0.9, index: 0 },
      { text: 'Golden retriever', confidence: 0.8, index: 1 },
    ]);
    const analyzer = createMlKitPetPhotoAnalyzer();
    const result = await analyzer.analyze('file:///a.jpg');
    expect(result.species).toBe('dog');
    expect(ImageLabeling.label).toHaveBeenCalledWith('file:///a.jpg');
  });
});
