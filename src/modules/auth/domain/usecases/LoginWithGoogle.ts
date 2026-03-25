import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class LoginWithGoogle {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<User> {
    return this.repository.loginWithGoogle();
  }
}
