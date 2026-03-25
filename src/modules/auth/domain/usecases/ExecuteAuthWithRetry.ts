import { isAuthError } from '../models/AuthError';

const RETRYABLE_CODES = new Set(['network']);

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export class ExecuteAuthWithRetry {
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (
          attempt >= 1 ||
          !isAuthError(error) ||
          !RETRYABLE_CODES.has(error.code)
        ) {
          throw error;
        }
        attempt += 1;
        await sleep(400);
      }
    }
  }
}
