import {
  PET_PHOTO_MAX_DATA_URI_CHARS,
  assertPetPhotoDataUriWithinLimit,
  buildJpegDataUri,
} from '../petPhotoLimits';

describe('petPhotoLimits', () => {
  it('builds a jpeg data URI', () => {
    expect(buildJpegDataUri('abc')).toBe('data:image/jpeg;base64,abc');
  });

  it('accepts a data URI under the limit', () => {
    expect(() =>
      assertPetPhotoDataUriWithinLimit(buildJpegDataUri('abc')),
    ).not.toThrow();
  });

  it('rejects a data URI over the limit', () => {
    const oversized = 'data:image/jpeg;base64,' + 'a'.repeat(PET_PHOTO_MAX_DATA_URI_CHARS);
    expect(() => assertPetPhotoDataUriWithinLimit(oversized)).toThrow(
      /too large/i,
    );
  });
});
