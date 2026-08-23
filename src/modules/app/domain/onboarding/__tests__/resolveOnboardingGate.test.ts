import { resolveOnboardingGate } from '../resolveOnboardingGate';

describe('resolveOnboardingGate', () => {
  const base = {
    onboardingCompleted: false,
    isAuthenticated: false,
    hasPets: false,
    phase: 'welcome' as const,
    entryIntent: null,
    activationReady: false,
    firstWinPersisted: false,
  };

  it('complete when onboardingCompleted', () => {
    expect(resolveOnboardingGate({ ...base, onboardingCompleted: true })).toBe(
      'complete',
    );
  });

  it('complete when authenticated returning with pets', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        isAuthenticated: true,
        hasPets: true,
        phase: 'welcome',
      }),
    ).toBe('complete');
  });

  it('welcome when fresh', () => {
    expect(resolveOnboardingGate(base)).toBe('welcome');
  });

  it('activate when phase activate', () => {
    expect(resolveOnboardingGate({ ...base, phase: 'activate' })).toBe(
      'activate',
    );
  });

  it('auth when activationReady and not authenticated', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'activate',
        activationReady: true,
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('persist when authenticated, ready, not yet persisted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'persist',
        activationReady: true,
        isAuthenticated: true,
        firstWinPersisted: false,
      }),
    ).toBe('persist');
  });

  it('paywall when first win persisted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'paywall',
        isAuthenticated: true,
        firstWinPersisted: true,
        activationReady: true,
      }),
    ).toBe('paywall');
  });

  it('auth when sign_in intent and not authenticated', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        entryIntent: 'sign_in',
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('welcome when sign_in intent but authenticated with no pets', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        entryIntent: 'sign_in',
        isAuthenticated: true,
        hasPets: false,
      }),
    ).toBe('welcome');
  });
});
