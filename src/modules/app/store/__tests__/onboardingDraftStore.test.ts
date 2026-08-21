import {
  createDefaultOnboardingDraft,
  setCareInterests,
} from '../../domain/onboarding/onboardingDraftReducers';
import { storageService } from '../../../../infrastructure/storage/storageService';
import { registerOnboardingSettingsPort } from '../onboardingCoordinationPorts';
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

describe('onboardingDraftStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    registerOnboardingSettingsPort({
      persistOnboardingCompletion: async () => false,
    });
    useOnboardingDraftStore.setState({
      draft: createDefaultOnboardingDraft(),
    });
  });

  it('hydrate loads draft from data source', async () => {
    mockGetItem.mockResolvedValueOnce({
      step: 2,
    });

    await useOnboardingDraftStore.getState().hydrate();

    expect(useOnboardingDraftStore.getState().draft.step).toBe(2);
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
