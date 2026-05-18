import type { ImageSourcePropType } from 'react-native';

import { images } from '../assets/images';
import type { PetType } from '../../modules/pets/domain/models/Pet';
import { isPetPhotoPlaceholderUri } from '../../modules/pets/domain/utils/petPhotoPlaceholder';

/**
 * Resolves the image to show for a pet: real photo URL when set, otherwise
 * bundled dog/cat placeholders (never a single-species remote default).
 */
export function resolvePetAvatarSource(input: {
  type?: PetType | null;
  photo?: string | null;
}): ImageSourcePropType {
  const raw = input.photo?.trim();
  if (raw && !isPetPhotoPlaceholderUri(raw)) {
    return { uri: raw };
  }
  const species: PetType = input.type === 'cat' ? 'cat' : 'dog';
  return species === 'cat' ? images.catHd6 : images.petHd1;
}
