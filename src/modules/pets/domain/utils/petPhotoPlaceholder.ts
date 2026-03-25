const PET_PHOTO_PLACEHOLDER_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDP617HtYuv4CiktH2Mn5DR3V8qiKsz_gbkRMw8DRhDtSdABlZHFGZwPFUs_L0qts--7PYAEigCACBJ9uh4obJZgP5Q84qVyq8R-pzW8g5yZ435BTVhDQD6d_RsQujzmYgkWWzDPHVxAGWZszwrkNVBTErZfmwBQlp3iLk05ZY7NhS-5whUgni2DFXrdiQww9fi81k-3AfybVG0EO24r-2mewFFWll5owCe-OVGDFXTFBTUI6KpLttwzEeCGcUzKfn_UM_EhHvTH_CM';

export function isPetPhotoPlaceholderUri(
  uri: string | null | undefined,
): boolean {
  if (!uri) {
    return true;
  }
  return uri === PET_PHOTO_PLACEHOLDER_URI;
}

export { PET_PHOTO_PLACEHOLDER_URI };

