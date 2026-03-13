import type { Settings } from '../../domain/models/Settings';
import type { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import type { SettingsLocalDataSource } from '../datasources/SettingsLocalDataSource';
import { createSettingsLocalDataSource } from '../datasources/SettingsLocalDataSource';

export class SettingsRepositoryImpl implements SettingsRepository {
  constructor(private readonly local: SettingsLocalDataSource) {}

  async getSettings(): Promise<Settings> {
    return this.local.getSettings();
  }

  async updateSettings(settings: Settings): Promise<Settings> {
    await this.local.saveSettings(settings);
    return settings;
  }
}

export const createSettingsRepository = (): SettingsRepository => {
  const local = createSettingsLocalDataSource();
  return new SettingsRepositoryImpl(local);
};

