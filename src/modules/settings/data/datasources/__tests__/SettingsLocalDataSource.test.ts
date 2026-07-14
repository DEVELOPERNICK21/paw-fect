import { createSettingsLocalDataSource } from '../SettingsLocalDataSource';
import { storageService } from '../../../../../infrastructure/storage/storageService';

jest.mock('../../../../../infrastructure/storage/storageService', () => ({
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockGetItem = storageService.getItem as jest.Mock;

describe('SettingsLocalDataSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default careInterests empty array when nothing stored', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual([]);
    expect(settings.onboardingCompleted).toBe(false);
  });

  it('fills careInterests when loading legacy settings without the field', async () => {
    mockGetItem.mockResolvedValueOnce({
      notificationsEnabled: true,
      emailUpdates: false,
      onboardingCompleted: true,
      themeMode: 'dark',
    });
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual([]);
    expect(settings.emailUpdates).toBe(false);
    expect(settings.themeMode).toBe('dark');
  });

  it('preserves stored careInterests', async () => {
    mockGetItem.mockResolvedValueOnce({
      notificationsEnabled: true,
      emailUpdates: true,
      onboardingCompleted: true,
      themeMode: 'system',
      careInterests: ['vaccines', 'walks'],
    });
    const ds = createSettingsLocalDataSource();
    const settings = await ds.getSettings();
    expect(settings.careInterests).toEqual(['vaccines', 'walks']);
  });
});
