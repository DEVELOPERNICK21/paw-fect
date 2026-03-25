import type { User } from '../models/User';

export class StartAuthSessionListener {
  constructor(
    private readonly repository: {
      subscribeSession(onChange: (user: User | null) => void): () => void;
    },
  ) {}

  execute(onChange: (user: User | null) => void): () => void {
    return this.repository.subscribeSession(onChange);
  }
}
