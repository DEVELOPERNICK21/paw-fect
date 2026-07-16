import {
  createDefaultOnboardingDraft,
  setCareInterests,
} from '../../domain/onboarding/onboardingDraftReducers';
import { storageService } from '../../../../infrastructure/storage/storageService';
import { useSettingsStore } from '../../../settings/store/settingsStore';
import { useOnboardingDraftStore } from '../onboardingDraftStore';

jest.mock('../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../../settings/store/settingsStore', () => ({
  useSettingsStore: {
    getState: jest.fn(),
  },
}));

const mockGetItem = storageService.getItem as jest.Mock;
const mockSetItem = storageService.setItem as jest.Mock;
const mockRemoveItem = storageService.removeItem as jest.Mock;
const mockGetState = useSettingsStore.getState as jest.Mock;

describe('onboardingDraftStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
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
    const updateSettings = jest.fn().mockResolvedValue(undefined);
    mockGetState.mockReturnValue({
      settings: {
        notificationsEnabled: true,
        emailUpdates: true,
        onboardingCompleted: false,
        themeMode: 'system',
        careInterests: [],
      },
      updateSettings,
    });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['vaccines', 'walks']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        careInterests: ['vaccines', 'walks'],
        onboardingCompleted: true,
      }),
    );
    expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_draft');
    expect(useOnboardingDraftStore.getState().draft).toEqual(
      createDefaultOnboardingDraft(),
    );
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('completeFunnel does not clear draft when settings are missing', async () => {
    const updateSettings = jest.fn();
    mockGetState.mockReturnValue({
      settings: null,
      updateSettings,
    });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['vaccines', 'walks']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(updateSettings).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(useOnboardingDraftStore.getState().draft.careInterests).toEqual([
      'vaccines',
      'walks',
    ]);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('completeFunnel does not clear draft when updateSettings throws', async () => {
    const updateSettings = jest
      .fn()
      .mockRejectedValue(new Error('settings update failed'));
    mockGetState.mockReturnValue({
      settings: {
        notificationsEnabled: true,
        emailUpdates: true,
        onboardingCompleted: false,
        themeMode: 'system',
        careInterests: [],
      },
      updateSettings,
    });

    useOnboardingDraftStore.getState().update(draft =>
      setCareInterests(draft, ['meds']),
    );
    mockSetItem.mockClear();

    await useOnboardingDraftStore.getState().completeFunnel();

    expect(updateSettings).toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(useOnboardingDraftStore.getState().draft.careInterests).toEqual([
      'meds',
    ]);
  });
});
