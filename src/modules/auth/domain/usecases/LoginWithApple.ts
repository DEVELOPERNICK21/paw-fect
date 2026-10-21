import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class LoginWithApple {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<User> {
    return this.repository.loginWithApple();
  }
}
