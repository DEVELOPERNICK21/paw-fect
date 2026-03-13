import type { AuthRepository } from '../repositories/AuthRepository';

export class LogoutUser {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<void> {
    return this.repository.logout();
  }
}

