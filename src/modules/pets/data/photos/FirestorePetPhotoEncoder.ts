import type {
  PetPhotoEncodeRequest,
  PetPhotoEncoder,
} from '../../domain/ports/PetPhotoEncoder';
import {
  assertPetPhotoDataUriWithinLimit,
  buildJpegDataUri,
} from '../../domain/utils/petPhotoLimits';

class FirestorePetPhotoEncoder implements PetPhotoEncoder {
  async encode(request: PetPhotoEncodeRequest): Promise<string> {
    const dataUri = buildJpegDataUri(request.base64);
    assertPetPhotoDataUriWithinLimit(dataUri);
    return dataUri;
  }
}

export function createFirestorePetPhotoEncoder(): PetPhotoEncoder {
  return new FirestorePetPhotoEncoder();
}
