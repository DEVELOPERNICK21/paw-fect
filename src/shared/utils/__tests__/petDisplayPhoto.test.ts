import { resolvePetAvatarSource } from '../petDisplayPhoto';

describe('resolvePetAvatarSource', () => {
  it('uses a data URI as the image source', () => {
    const photo = 'data:image/jpeg;base64,qq';
    expect(resolvePetAvatarSource({ type: 'dog', photo })).toEqual({
      uri: photo,
    });
  });

  it('falls back to bundled art when photo is empty', () => {
    const source = resolvePetAvatarSource({ type: 'cat', photo: undefined });
    expect(source).not.toEqual(
      expect.objectContaining({ uri: expect.any(String) }),
    );
  });
});
