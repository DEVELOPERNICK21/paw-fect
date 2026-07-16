import { resolveOnboardingGate } from '../resolveOnboardingGate';

describe('resolveOnboardingGate', () => {
  it('returns complete when onboardingCompleted is true', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: true,
        phase: 'quiz',
        commitmentAccepted: false,
        isAuthenticated: false,
      }),
    ).toBe('complete');
  });

  it('returns complete when phase is done', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'done',
        commitmentAccepted: true,
        isAuthenticated: true,
      }),
    ).toBe('complete');
  });

  it('returns tips when phase is tips', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'tips',
        commitmentAccepted: true,
        isAuthenticated: true,
      }),
    ).toBe('tips');
  });

  it('returns paywall when phase is paywall and authenticated', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'paywall',
        commitmentAccepted: true,
        isAuthenticated: true,
      }),
    ).toBe('paywall');
  });

  it('returns auth when phase is paywall and unauthenticated', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'paywall',
        commitmentAccepted: true,
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('returns auth when quiz phase, commitment accepted, unauthenticated', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'quiz',
        commitmentAccepted: true,
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('returns paywall when quiz phase, commitment accepted, authenticated', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'quiz',
        commitmentAccepted: true,
        isAuthenticated: true,
      }),
    ).toBe('paywall');
  });

  it('returns quiz by default when commitment not accepted', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'quiz',
        commitmentAccepted: false,
        isAuthenticated: false,
      }),
    ).toBe('quiz');
  });

  it('returns quiz when commitment not accepted even if authenticated', () => {
    expect(
      resolveOnboardingGate({
        onboardingCompleted: false,
        phase: 'quiz',
        commitmentAccepted: false,
        isAuthenticated: true,
      }),
    ).toBe('quiz');
  });
});
