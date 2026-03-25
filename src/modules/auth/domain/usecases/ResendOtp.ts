import type { AuthRepository } from '../repositories/AuthRepository';

export class ResendOtp {
  constructor(private readonly repository: AuthRepository) {}

  async execute(phoneE164: string): Promise<string> {
    return this.repository.resendOtp(phoneE164);
  }
}
