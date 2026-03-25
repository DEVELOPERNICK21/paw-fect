import type { User } from '../models/User';
import type { AuthRepository } from '../repositories/AuthRepository';

export class VerifyOtp {
  constructor(private readonly repository: AuthRepository) {}

  async execute(verificationId: string, otpCode: string): Promise<User> {
    return this.repository.verifyOtp(verificationId, otpCode);
  }
}
