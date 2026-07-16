import type { OnboardingProblem } from '../../../domain/onboarding/OnboardingDraft';
import { createOnboardingDraftDataSource } from '../OnboardingDraftDataSource';
import { createDefaultOnboardingDraft } from '../../../domain/onboarding/onboardingDraftReducers';
import { storageService } from '../../../../../infrastructure/storage/storageService';

jest.mock('../../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockGetItem = storageService.getItem as jest.Mock;
const mockSetItem = storageService.setItem as jest.Mock;
const mockRemoveItem = storageService.removeItem as jest.Mock;

describe('OnboardingDraftDataSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getDraft returns default when nothing stored', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const ds = createOnboardingDraftDataSource();
    const draft = await ds.getDraft();
    expect(draft).toEqual(createDefaultOnboardingDraft());
  });

  it('saveDraft round-trips stored draft', async () => {
    const draft = {
      ...createDefaultOnboardingDraft(),
      step: 3,
      problems: ['missed_vaccines'] as OnboardingProblem[],
    };
    mockGetItem.mockResolvedValueOnce(draft);
    const ds = createOnboardingDraftDataSource();
    await ds.saveDraft(draft);
    expect(mockSetItem).toHaveBeenCalledWith('onboarding_draft', draft);
    const loaded = await ds.getDraft();
    expect(loaded.step).toBe(3);
    expect(loaded.problems).toEqual(['missed_vaccines']);
  });

  it('clearDraft removes storage key', async () => {
    const ds = createOnboardingDraftDataSource();
    await ds.clearDraft();
    expect(mockRemoveItem).toHaveBeenCalledWith('onboarding_draft');
  });
});
