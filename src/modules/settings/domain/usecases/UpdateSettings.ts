import type { Settings } from '../models/Settings';
import type { SettingsRepository } from '../repositories/SettingsRepository';

export class UpdateSettings {
  constructor(private readonly repository: SettingsRepository) {}

  async execute(settings: Settings): Promise<Settings> {
    return this.repository.updateSettings(settings);
  }
}
