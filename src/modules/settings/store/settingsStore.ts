import { create } from 'zustand';
import type { Settings, ThemePreference } from '../domain/models/Settings';
import { settingsComposition } from '../settingsComposition';

export interface SettingsState {
  settings: Settings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  setThemeMode: (themeMode: ThemePreference) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const settings = await settingsComposition.getSettings.execute();
      set({ settings });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] loadSettings error', error);
    }
  },

  updateSettings: async (settings: Settings) => {
    try {
      const updated = await settingsComposition.updateSettings.execute(settings);
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

      const nextSettings = settingsComposition.setThemeMode.execute(
        currentSettings,
        themeMode,
      );
      set({ settings: nextSettings });
      await settingsComposition.updateSettings.execute(nextSettings);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] setThemeMode error', error);
    }
  },
}));

