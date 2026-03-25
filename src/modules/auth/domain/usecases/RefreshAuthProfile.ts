import type { User } from '../models/User';

export class RefreshAuthProfile {
  constructor(
    private readonly repository: {
      refreshProfileFromRemoteSession(): Promise<User | null>;
    },
  ) {}

  execute(): Promise<User | null> {
    return this.repository.refreshProfileFromRemoteSession();
  }
}
