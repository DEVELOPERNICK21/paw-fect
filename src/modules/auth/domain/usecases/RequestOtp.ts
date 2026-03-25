import type { AuthRepository } from '../repositories/AuthRepository';

export class RequestOtp {
  constructor(private readonly repository: AuthRepository) {}

  async execute(phoneE164: string): Promise<string> {
    return this.repository.requestOtp(phoneE164);
  }
}
