import type { User } from '../../models/User';
import type { AuthRepository } from '../../repositories/AuthRepository';
import { LoginWithApple } from '../LoginWithApple';

const user: User = {
  id: 'uid-1',
  email: 'abc@privaterelay.appleid.com',
  displayName: 'Pat Owner',
  photoURL: null,
  phoneNumber: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  onboardingCompleted: false,
};

describe('LoginWithApple', () => {
  it('delegates to the repository and returns the signed-in user', async () => {
    const loginWithApple = jest.fn().mockResolvedValue(user);
    const useCase = new LoginWithApple({ loginWithApple } as unknown as AuthRepository);

    await expect(useCase.execute()).resolves.toBe(user);
    expect(loginWithApple).toHaveBeenCalledTimes(1);
  });

  it('propagates repository errors', async () => {
    const error = new Error('cancelled');
    const useCase = new LoginWithApple({
      loginWithApple: jest.fn().mockRejectedValue(error),
    } as unknown as AuthRepository);

    await expect(useCase.execute()).rejects.toBe(error);
  });
});
