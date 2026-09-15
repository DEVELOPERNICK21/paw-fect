import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves when the promise settles before the timeout', async () => {
    const resultPromise = withTimeout(
      Promise.resolve('ok'),
      1000,
      'timed out',
    );
    await expect(resultPromise).resolves.toBe('ok');
  });

  it('rejects when the timeout elapses first', async () => {
    const slow = new Promise<string>(() => undefined);
    const resultPromise = withTimeout(slow, 500, 'timed out');
    const expectation = expect(resultPromise).rejects.toThrow('timed out');
    await jest.advanceTimersByTimeAsync(500);
    await expectation;
  });
});
