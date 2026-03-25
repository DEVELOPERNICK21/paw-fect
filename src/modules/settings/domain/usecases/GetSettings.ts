import type { Settings } from '../models/Settings';
import type { SettingsRepository } from '../repositories/SettingsRepository';

export class GetSettings {
  constructor(private readonly repository: SettingsRepository) {}

  async execute(): Promise<Settings> {
    return this.repository.getSettings();
  }
}
