import { DeleteAccount } from '../DeleteAccount';
import type { AuthRepository } from '../../repositories/AuthRepository';

describe('DeleteAccount', () => {
  it('calls repository.deleteAccount', async () => {
    const repository: Pick<AuthRepository, 'deleteAccount'> = {
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new DeleteAccount(repository as AuthRepository);
    await useCase.execute();

    expect(repository.deleteAccount).toHaveBeenCalledTimes(1);
  });

  it('propagates repository errors', async () => {
    const repository: Pick<AuthRepository, 'deleteAccount'> = {
      deleteAccount: jest.fn().mockRejectedValue(new Error('requires recent login')),
    };

    const useCase = new DeleteAccount(repository as AuthRepository);
    await expect(useCase.execute()).rejects.toThrow('requires recent login');
  });
});
