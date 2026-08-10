import type {
  PetPhotoEncodeRequest,
  PetPhotoEncoder,
} from '../ports/PetPhotoEncoder';

export type PreparePetPhotoResult =
  | { ok: true; photo: string }
  | { ok: false; errorMessage: string };

export class PreparePetPhoto {
  constructor(private readonly encoder: PetPhotoEncoder) {}

  async execute(request: PetPhotoEncodeRequest): Promise<PreparePetPhotoResult> {
    if (!request.base64?.trim()) {
      return {
        ok: false,
        errorMessage: 'Could not read that photo. Try another one.',
      };
    }
    try {
      const photo = await this.encoder.encode({
        localUri: request.localUri,
        base64: request.base64.trim(),
      });
      return { ok: true, photo };
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Could not prepare that photo. Try another one.';
      return { ok: false, errorMessage: message };
    }
  }
}
