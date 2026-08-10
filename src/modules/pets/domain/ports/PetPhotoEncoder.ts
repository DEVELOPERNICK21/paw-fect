export type PetPhotoEncodeRequest = {
  /** Local file URI from the picker (kept for a future Storage/URL encoder). */
  localUri: string;
  /** JPEG base64 without data-URI prefix, from compressed picker output. */
  base64: string;
};

export interface PetPhotoEncoder {
  encode(request: PetPhotoEncodeRequest): Promise<string>;
}
