import { PermissionsAndroid, Platform } from 'react-native';
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

/**
 * If CAMERA is declared in AndroidManifest (it is), image-picker requires a
 * runtime grant before launchCamera — otherwise it returns the "does not
 * require Manifest.permission.CAMERA" error (or the camera Activity can
 * SecurityException on some OEMs).
 */
async function ensureAndroidCameraPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return;
  }
  const result = await PermissionsAndroid.request(permission, {
    title: 'Camera permission',
    message: 'Pawsoul needs camera access so you can take a photo of your pet.',
    buttonPositive: 'OK',
    buttonNegative: 'Cancel',
  });
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('PERMISSION_DENIED');
  }
}

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
    const message = response.errorMessage ?? '';
    if (/Manifest\.permission\.CAMERA/i.test(message)) {
      throw new Error('PERMISSION_DENIED');
    }
    throw new Error(message || 'Could not open the photo picker.');
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
  if (source === 'camera') {
    await ensureAndroidCameraPermission();
    return mapResponse(await launchCamera(pickerOptions));
  }
  return mapResponse(await launchImageLibrary(pickerOptions));
}
