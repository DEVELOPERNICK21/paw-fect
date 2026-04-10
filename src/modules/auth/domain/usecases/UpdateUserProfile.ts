import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class UpdateUserProfile {
  constructor(private readonly repository: AuthRepository) {}

  async execute(input: {
    displayName: string;
    phoneNumber: string | null;
  }): Promise<User> {
    return this.repository.updateUserProfile(input);
  }
}
