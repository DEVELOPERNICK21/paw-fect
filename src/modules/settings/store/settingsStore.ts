import { create } from 'zustand';
import type { Settings, ThemePreference } from '../domain/models/Settings';
import { createSettingsRepository } from '../data/repositories/SettingsRepositoryImpl';
import { GetSettings } from '../domain/usecases/GetSettings';
import { UpdateSettings } from '../domain/usecases/UpdateSettings';
import { SetThemeMode } from '../domain/usecases/SetThemeMode';

export interface SettingsState {
  settings: Settings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  setThemeMode: (themeMode: ThemePreference) => Promise<void>;
}

const repository = createSettingsRepository();
const getSettingsUseCase = new GetSettings(repository);
const updateSettingsUseCase = new UpdateSettings(repository);
const setThemeModeUseCase = new SetThemeMode();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const settings = await getSettingsUseCase.execute();
      set({ settings });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] loadSettings error', error);
    }
  },

  updateSettings: async (settings: Settings) => {
    try {
      const updated = await updateSettingsUseCase.execute(settings);
      set({ settings: updated });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] updateSettings error', error);
    }
  },

  setThemeMode: async (themeMode: ThemePreference) => {
    try {
      const currentSettings = get().settings;
      if (!currentSettings) return;

      const nextSettings = setThemeModeUseCase.execute(currentSettings, themeMode);
      set({ settings: nextSettings });
      await updateSettingsUseCase.execute(nextSettings);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] setThemeMode error', error);
    }
  },
}));

