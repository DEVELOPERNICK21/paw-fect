import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class SignupUser {
  constructor(private readonly repository: AuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    return this.repository.signup(email, password);
  }
}

