import { isFirstWinPersisted, resolveOnboardingGate } from '../resolveOnboardingGate';

describe('resolveOnboardingGate', () => {
  const base = {
    onboardingCompleted: false,
    isAuthenticated: false,
    hasPets: false,
    phase: 'welcome' as const,
    entryIntent: null,
    activationSubmitted: false,
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

  it('stays activate when drafts are ready but not yet submitted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'activate',
        activationSubmitted: false,
        isAuthenticated: false,
      }),
    ).toBe('activate');
  });

  it('auth when activationSubmitted and not authenticated', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'activate',
        activationSubmitted: true,
        isAuthenticated: false,
      }),
    ).toBe('auth');
  });

  it('persist when authenticated, submitted, not yet persisted', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'persist',
        activationSubmitted: true,
        isAuthenticated: true,
        firstWinPersisted: false,
      }),
    ).toBe('persist');
  });

  it('persist when authenticated, submitted, phase still activate', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        phase: 'activate',
        activationSubmitted: true,
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
        activationSubmitted: true,
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

  it('complete when sign_in intent and authenticated with pets', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        entryIntent: 'sign_in',
        isAuthenticated: true,
        hasPets: true,
      }),
    ).toBe('complete');
  });

  it('activate when sign_in intent and authenticated with empty account', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        entryIntent: 'sign_in',
        isAuthenticated: true,
        hasPets: false,
      }),
    ).toBe('activate');
  });

  it('welcome when sign_in intent, authenticated, pets still loading', () => {
    expect(
      resolveOnboardingGate({
        ...base,
        entryIntent: 'sign_in',
        isAuthenticated: true,
        hasPets: false,
        petsLoading: true,
      }),
    ).toBe('welcome');
  });
});

describe('isFirstWinPersisted', () => {
  it('false when pet not yet created', () => {
    expect(
      isFirstWinPersisted({ createdPetId: null, phase: 'persist' }),
    ).toBe(false);
  });

  it('false when pet created but still on activate', () => {
    expect(
      isFirstWinPersisted({ createdPetId: 'pet-1', phase: 'activate' }),
    ).toBe(false);
  });

  it('true when pet created and phase advanced past activation', () => {
    expect(
      isFirstWinPersisted({ createdPetId: 'pet-1', phase: 'paywall' }),
    ).toBe(true);
  });
});
