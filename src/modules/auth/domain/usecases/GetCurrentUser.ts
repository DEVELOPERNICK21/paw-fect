import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class GetCurrentUser {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<User | null> {
    return this.repository.getCurrentUser();
  }
}

