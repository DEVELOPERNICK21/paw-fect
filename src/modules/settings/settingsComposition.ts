import { createSettingsRepository } from './data/repositories/SettingsRepositoryImpl';
import { GetSettings } from './domain/usecases/GetSettings';
import { SetThemeMode } from './domain/usecases/SetThemeMode';
import { UpdateSettings } from './domain/usecases/UpdateSettings';

const repository = createSettingsRepository();

export const settingsComposition = {
  getSettings: new GetSettings(repository),
  updateSettings: new UpdateSettings(repository),
  setThemeMode: new SetThemeMode(),
} as const;
