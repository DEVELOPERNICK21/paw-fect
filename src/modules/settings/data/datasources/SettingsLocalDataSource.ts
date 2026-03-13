import type { Settings } from '../../domain/models/Settings';
import { storageService } from '../../../../infrastructure/storage/storageService';

const SETTINGS_STORAGE_KEY = 'settings';

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  emailUpdates: true,
};

export interface SettingsLocalDataSource {
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

class SettingsLocalDataSourceImpl implements SettingsLocalDataSource {
  async getSettings(): Promise<Settings> {
    const stored = await storageService.getItem<Settings | null>(
      SETTINGS_STORAGE_KEY,
    );
    return stored ?? DEFAULT_SETTINGS;
  }

  async saveSettings(settings: Settings): Promise<void> {
    await storageService.setItem(SETTINGS_STORAGE_KEY, settings);
  }
}

export const createSettingsLocalDataSource = (): SettingsLocalDataSource =>
  new SettingsLocalDataSourceImpl();

