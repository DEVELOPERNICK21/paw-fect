import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type PhotoQuality,
} from 'react-native-image-picker';

import type { PetPhotoEncodeRequest } from '../../domain/ports/PetPhotoEncoder';
import {
  PET_PHOTO_JPEG_QUALITY,
  PET_PHOTO_MAX_EDGE,
} from '../../domain/utils/petPhotoLimits';

const pickerOptions = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: PET_PHOTO_MAX_EDGE,
  maxHeight: PET_PHOTO_MAX_EDGE,
  quality: PET_PHOTO_JPEG_QUALITY as PhotoQuality,
  saveToPhotos: false,
};

function mapResponse(
  response: ImagePickerResponse,
): PetPhotoEncodeRequest | null {
  if (response.didCancel) {
    return null;
  }
  if (response.errorCode === 'permission') {
    throw new Error('PERMISSION_DENIED');
  }
  if (response.errorCode) {
    throw new Error(response.errorMessage ?? 'Could not open the photo picker.');
  }
  const asset = response.assets?.[0];
  const localUri = asset?.uri?.trim();
  const base64 = asset?.base64?.trim();
  if (!localUri || !base64) {
    throw new Error('Could not read that photo. Try another one.');
  }
  return { localUri, base64 };
}

export async function pickPetPhoto(
  source: 'camera' | 'library',
): Promise<PetPhotoEncodeRequest | null> {
  const response =
    source === 'camera'
      ? await launchCamera(pickerOptions)
      : await launchImageLibrary(pickerOptions);
  return mapResponse(response);
}
