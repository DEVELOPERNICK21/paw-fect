import { createFirestorePetPhotoEncoder } from '../FirestorePetPhotoEncoder';
import { PET_PHOTO_MAX_DATA_URI_CHARS } from '../../../domain/utils/petPhotoLimits';

describe('createFirestorePetPhotoEncoder', () => {
  it('returns a jpeg data URI for valid base64', async () => {
    const encoder = createFirestorePetPhotoEncoder();
    await expect(
      encoder.encode({ localUri: 'file:///x.jpg', base64: 'qq' }),
    ).resolves.toBe('data:image/jpeg;base64,qq');
  });

  it('rejects oversized payloads', async () => {
    const encoder = createFirestorePetPhotoEncoder();
    const base64 = 'a'.repeat(PET_PHOTO_MAX_DATA_URI_CHARS);
    await expect(
      encoder.encode({ localUri: 'file:///x.jpg', base64 }),
    ).rejects.toThrow(/too large/i);
  });
});
