import { create } from 'zustand';
import type { Settings } from '../domain/models/Settings';
import { createSettingsRepository } from '../data/repositories/SettingsRepositoryImpl';

export interface SettingsState {
  settings: Settings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

const repository = createSettingsRepository();

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,

  loadSettings: async () => {
    try {
      const settings = await repository.getSettings();
      set({ settings });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] loadSettings error', error);
    }
  },

  updateSettings: async (settings: Settings) => {
    try {
      const updated = await repository.updateSettings(settings);
      set({ settings: updated });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[settingsStore] updateSettings error', error);
    }
  },
}));

