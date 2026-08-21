/** Longest edge after pick — large enough for hero cards without blowing Firestore size. */
export const PET_PHOTO_MAX_EDGE = 768;
/** JPEG quality at encode time (0–1). Slightly higher than 0.7 for clearer profile heroes. */
export const PET_PHOTO_JPEG_QUALITY = 0.82;
export const PET_PHOTO_MAX_DATA_URI_CHARS = 700_000;

export function buildJpegDataUri(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function assertPetPhotoDataUriWithinLimit(dataUri: string): void {
  if (dataUri.length > PET_PHOTO_MAX_DATA_URI_CHARS) {
    throw new Error('Photo is too large. Try a different image.');
  }
}
