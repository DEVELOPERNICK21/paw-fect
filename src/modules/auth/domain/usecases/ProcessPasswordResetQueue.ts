export class ProcessPasswordResetQueue {
  constructor(
    private readonly repository: {
      processPasswordResetQueue(): Promise<void>;
    },
  ) {}

  execute(): Promise<void> {
    return this.repository.processPasswordResetQueue();
  }
}

