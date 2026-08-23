import type { ReminderDraft } from '../../domain/onboarding/OnboardingDraft';
import {
  createDefaultOnboardingDraft,
  setCareInterests,
  setPetDraft,
  setReminderDraft,
} from '../../domain/onboarding/onboardingDraftReducers';
import { trackEvent } from '../../../../infrastructure/analytics/analytics';
import { storageService } from '../../../../infrastructure/storage/storageService';
import {
  registerOnboardingActivationPort,
  registerOnboardingSettingsPort,
} from '../onboardingCoordinationPorts';
import { useOnboardingDraftStore } from '../onboardingDraftStore';

jest.mock('../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../../../infrastructure/analytics/analytics', () => ({
  trackEvent: jest.fn(),
}));

const mockGetItem = storageService.getItem as jest.Mock;
const mockSetItem = storageService.setItem as jest.Mock;
const mockRemoveItem = storageService.removeItem as jest.Mock;
const mockTrackEvent = trackEvent as jest.Mock;

const testPetDraft = {
  species: 'dog' as const,
  ageBand: 'adult' as const,
  nickname: 'Milo',
};

const testReminderDraft: ReminderDraft = {
  kind: 'walk',
  title: "Milo's walk",
  date: '2026-08-24',
  time: '08:00',
  repeat: 'daily',
  reminderType: 'other',
};

describe('onboardingDraftStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    registerOnboardingSettingsPort({
      persistOnboardingCompletion: async () => false,
    });
    registerOnboardingActivationPort({
      createPetFromDraft: async () => ({
        ok: false,
        errorMessage: 'Onboarding activation is not configured.',
      }),
      createReminderFromDraft: async () => ({
        ok: false,
        errorMessage: 'Onboarding activation is not configured.',
      }),
    });
    useOnboardingDraftStore.setState({
      draft: createDefaultOnboardingDraft(),
    });
  });

  it('hydrate loads draft from data source', async () => {
    mockGetItem.mockResolvedValueOnce({
      step: 2,
      phase: 'activate',
      petDraft: testPetDraft,
      reminderDraft: testReminderDraft,
    });

    await useOnboardingDraftStore.getState().hydrate();

    expect(useOnboardingDraftStore.getState().draft.step).toBe(2);
    expect(useOnboardingDraftStore.getState().draft.phase).toBe('activate');
  });

  it('hydrate resets legacy quiz draft to welcome default', async () => {
    mockGetItem.mockResolvedValueOnce({
      phase: 'quiz',
      step: 5,
      problems: ['missed_vaccines'],
      commitmentAccepted: true,
      petDraft: testPetDraft,
    });

    await useOnboardingDraftStore.getState().hydrate();

    expect(useOnboardingDraftStore.getState().draft).toEqual(
      createDefaultOnboardingDraft(),
    );
  });

  it('startActivation sets activate phase and entryIntent', () => {
    useOnboardingDraftStore.getState().startActivation();
    expect(useOnboardingDraftStore.getState().draft.phase).toBe('activate');
    expect(useOnboardingDraftStore.getState().draft.step).toBe(0);
    expect(useOnboardingDraftStore.getState().draft.entryIntent).toBe('activate');
    expect(useOnboardingDraftStore.getState().draft.activationSubmitted).toBe(false);
  });

  it('startActivation clears activationSubmitted', () => {
    useOnboardingDraftStore.getState().update(draft => ({
      ...draft,
      activationSubmitted: true,
    }));

    useOnboardingDraftStore.getState().startActivation();

    expect(useOnboardingDraftStore.getState().draft.activationSubmitted).toBe(
      false,
    );
  });

  it('submitActivation sets flag and advances to persist when authenticated', async () => {
    useOnboardingDraftStore.getState().submitActivation(true);
    await Promise.resolve();

    expect(useOnboardingDraftStore.getState().draft.activationSubmitted).toBe(
      true,
    );
    expect(useOnboardingDraftStore.getState().draft.phase).toBe('persist');
    expect(mockSetItem).toHaveBeenCalledWith(
      'onboarding_draft',
      expect.objectContaining({
        activationSubmitted: true,
        phase: 'persist',
      }),
    );
  });

  it('submitActivation sets flag but keeps activate phase when unauthenticated', async () => {
    useOnboardingDraftStore.getState().submitActivation(false);
    await Promise.resolve();

    expect(useOnboardingDraftStore.getState().draft.activationSubmitted).toBe(
      true,
    );
    expect(useOnboardingDraftStore.getState().draft.phase).toBe('welcome');
    expect(mockSetItem).toHaveBeenCalledWith(
      'onboarding_draft',
      expect.objectContaining({
        activationSubmitted: true,
        phase: 'welcome',
      }),
    );
  });

  it('setSignInIntent sets sign_in entryIntent', async () => {
    useOnboardingDraftStore.getState().setSignInIntent();
    await Promise.resolve();
    expect(useOnboardingDraftStore.getState().draft.entryIntent).toBe('sign_in');
    expect(mockSetItem).toHaveBeenCalledWith(
      'onboarding_draft',
      expect.objectContaining({ entryIntent: 'sign_in' }),
    );
  });

  it('goNext persists advanced draft', async () => {
    useOnboardingDraftStore.getState().goNext();
    await Promise.resolve();

    expect(useOnboardingDraftStore.getState().draft.step).toBe(1);
    expect(mockSetItem).toHaveBeenCalledWith(
      'onboarding_draft',
      expect.objectContaining({ step: 1 }),
    );
  });

  it('completeFunnel merges careInterests into settings and clears draft', async () => {
    const persistOnboardingCompletion = jest.fn().mockResolvedValue(true);
    registerOnboardingSettingsPort({ persistOnboardingCompletion });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['vaccines', 'walks']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(persistOnboardingCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        careInterests: ['vaccines', 'walks'],
        onboardingProfile: expect.objectContaining({
          careInterests: ['vaccines', 'walks'],
          paywallOutcome: 'purchased',
        }),
      }),
    );
    expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_draft');
    expect(useOnboardingDraftStore.getState().draft).toEqual(
      createDefaultOnboardingDraft(),
    );
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('completeFunnel does not clear draft when settings are missing', async () => {
    const persistOnboardingCompletion = jest.fn().mockResolvedValue(false);
    registerOnboardingSettingsPort({ persistOnboardingCompletion });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['vaccines', 'walks']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(persistOnboardingCompletion).toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(useOnboardingDraftStore.getState().draft.careInterests).toEqual([
      'vaccines',
      'walks',
    ]);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('persistFirstWin creates pet then reminder and advances to paywall', async () => {
    const createPetFromDraft = jest
      .fn()
      .mockResolvedValue({ ok: true, petId: 'pet-123' });
    const createReminderFromDraft = jest.fn().mockResolvedValue({ ok: true });
    registerOnboardingActivationPort({
      createPetFromDraft,
      createReminderFromDraft,
    });

    useOnboardingDraftStore.getState().update(draft =>
      setPetDraft(setReminderDraft(draft, testReminderDraft), testPetDraft),
    );
    mockSetItem.mockClear();

    const result = await useOnboardingDraftStore
      .getState()
      .persistFirstWin('user-1');

    expect(result).toEqual({ ok: true });
    expect(createPetFromDraft).toHaveBeenCalledWith({
      userId: 'user-1',
      pet: testPetDraft,
    });
    expect(createReminderFromDraft).toHaveBeenCalledWith({
      petId: 'pet-123',
      reminder: testReminderDraft,
    });
    expect(useOnboardingDraftStore.getState().draft.createdPetId).toBe(
      'pet-123',
    );
    expect(useOnboardingDraftStore.getState().draft.phase).toBe('paywall');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'onboarding_first_win_created',
      {
        reminder_kind: 'walk',
        species: 'dog',
      },
    );
  });

  it('persistFirstWin keeps createdPetId when reminder fails', async () => {
    const createPetFromDraft = jest
      .fn()
      .mockResolvedValue({ ok: true, petId: 'pet-456' });
    const createReminderFromDraft = jest.fn().mockResolvedValue({
      ok: false,
      errorMessage: 'Reminder save failed',
    });
    registerOnboardingActivationPort({
      createPetFromDraft,
      createReminderFromDraft,
    });

    useOnboardingDraftStore.getState().update(draft =>
      setPetDraft(setReminderDraft(draft, testReminderDraft), testPetDraft),
    );

    const result = await useOnboardingDraftStore
      .getState()
      .persistFirstWin('user-1');

    expect(result).toEqual({
      ok: false,
      errorMessage: 'Reminder save failed',
    });
    expect(useOnboardingDraftStore.getState().draft.createdPetId).toBe(
      'pet-456',
    );
    expect(useOnboardingDraftStore.getState().draft.phase).not.toBe('paywall');
    expect(mockTrackEvent).toHaveBeenCalledWith('onboarding_persist_failed', {
      stage: 'reminder',
    });
  });

  it('persistFirstWin skips pet create when createdPetId already set', async () => {
    const createPetFromDraft = jest.fn();
    const createReminderFromDraft = jest.fn().mockResolvedValue({ ok: true });
    registerOnboardingActivationPort({
      createPetFromDraft,
      createReminderFromDraft,
    });

    useOnboardingDraftStore.getState().update(draft => ({
      ...setPetDraft(setReminderDraft(draft, testReminderDraft), testPetDraft),
      createdPetId: 'pet-existing',
    }));

    const result = await useOnboardingDraftStore
      .getState()
      .persistFirstWin('user-1');

    expect(result).toEqual({ ok: true });
    expect(createPetFromDraft).not.toHaveBeenCalled();
    expect(createReminderFromDraft).toHaveBeenCalledWith({
      petId: 'pet-existing',
      reminder: testReminderDraft,
    });
  });

  it('completeFunnel does not clear draft when updateSettings swallows a storage failure', async () => {
    const persistOnboardingCompletion = jest.fn().mockResolvedValue(false);
    registerOnboardingSettingsPort({ persistOnboardingCompletion });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['meds']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(persistOnboardingCompletion).toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(useOnboardingDraftStore.getState().draft.careInterests).toEqual([
      'meds',
    ]);
    expect(useOnboardingDraftStore.getState().draft).not.toEqual(
      createDefaultOnboardingDraft(),
    );
  });
});
