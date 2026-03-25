export class SendPasswordResetEmail {
  constructor(
    private readonly repository: {
      sendPasswordResetEmail(email: string): Promise<void>;
    },
  ) {}

  execute(email: string): Promise<void> {
    return this.repository.sendPasswordResetEmail(email);
  }
}
