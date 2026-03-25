import type { Settings } from '../../domain/models/Settings';
import { storageService } from '../../../../infrastructure/storage/storageService';

const SETTINGS_STORAGE_KEY = 'settings';

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  emailUpdates: true,
  onboardingCompleted: false,
  themeMode: 'system',
};

export interface SettingsLocalDataSource {
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

class SettingsLocalDataSourceImpl implements SettingsLocalDataSource {
  async getSettings(): Promise<Settings> {
    const stored = await storageService.getItem<Partial<Settings> | null>(
      SETTINGS_STORAGE_KEY,
    );
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await storageService.setItem(SETTINGS_STORAGE_KEY, settings);
  }
}

export const createSettingsLocalDataSource = (): SettingsLocalDataSource =>
  new SettingsLocalDataSourceImpl();

