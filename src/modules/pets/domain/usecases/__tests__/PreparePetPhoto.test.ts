import { PreparePetPhoto } from '../PreparePetPhoto';
import type { PetPhotoEncoder } from '../../ports/PetPhotoEncoder';

describe('PreparePetPhoto', () => {
  it('returns opaque photo string from encoder', async () => {
    const encoder: PetPhotoEncoder = {
      encode: async () => 'data:image/jpeg;base64,abc',
    };
    const useCase = new PreparePetPhoto(encoder);
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: 'abc',
    });
    expect(result).toEqual({
      ok: true,
      photo: 'data:image/jpeg;base64,abc',
    });
  });

  it('maps encoder errors to ok:false', async () => {
    const encoder: PetPhotoEncoder = {
      encode: async () => {
        throw new Error('Photo is too large. Try a different image.');
      },
    };
    const useCase = new PreparePetPhoto(encoder);
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: 'x',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorMessage).toMatch(/too large/i);
  });

  it('rejects empty base64 before calling encoder', async () => {
    const encode = jest.fn();
    const useCase = new PreparePetPhoto({ encode });
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: '   ',
    });
    expect(result.ok).toBe(false);
    expect(encode).not.toHaveBeenCalled();
  });
});
