import type { Settings } from '../models/Settings';

export interface SettingsRepository {
  getSettings(): Promise<Settings>;
  updateSettings(settings: Settings): Promise<Settings>;
}

