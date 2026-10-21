import type { AuthRepository } from '../repositories/AuthRepository';

export class DeleteAccount {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<void> {
    return this.repository.deleteAccount();
  }
}
