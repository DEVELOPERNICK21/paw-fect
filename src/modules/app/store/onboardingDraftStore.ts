import { create } from 'zustand';

import { createOnboardingDraftDataSource } from '../data/onboarding/OnboardingDraftDataSource';
import type {
  OnboardingDraft,
  OnboardingPhase,
} from '../domain/onboarding/OnboardingDraft';
import {
  advanceStep,
  createDefaultOnboardingDraft,
  setPhase as setDraftPhase,
} from '../domain/onboarding/onboardingDraftReducers';
import { useSettingsStore } from '../../settings/store/settingsStore';

const dataSource = createOnboardingDraftDataSource();

export type OnboardingDraftReducer = (draft: OnboardingDraft) => OnboardingDraft;

const retreatStep = (draft: OnboardingDraft): OnboardingDraft => ({
  ...draft,
  step: Math.max(draft.step - 1, 0),
});

export interface OnboardingDraftState {
  draft: OnboardingDraft;
  hydrate: () => Promise<void>;
  save: () => Promise<void>;
  update: (reducer: OnboardingDraftReducer) => void;
  goNext: () => void;
  goBack: () => void;
  setPhase: (phase: OnboardingPhase) => void;
  completeFunnel: () => Promise<void>;
  clear: () => Promise<void>;
}

const persistDraft = async (draft: OnboardingDraft): Promise<void> => {
  await dataSource.saveDraft(draft);
};

export const useOnboardingDraftStore = create<OnboardingDraftState>((set, get) => ({
  draft: createDefaultOnboardingDraft(),

  hydrate: async () => {
    try {
      const draft = await dataSource.getDraft();
      set({ draft });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[onboardingDraftStore] hydrate error', error);
    }
  },

  save: async () => {
    try {
      await persistDraft(get().draft);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[onboardingDraftStore] save error', error);
    }
  },

  update: reducer => {
    const next = reducer(get().draft);
    set({ draft: next });
    void persistDraft(next);
  },

  goNext: () => {
    const next = advanceStep(get().draft);
    set({ draft: next });
    void persistDraft(next);
  },

  goBack: () => {
    const next = retreatStep(get().draft);
    set({ draft: next });
    void persistDraft(next);
  },

  setPhase: phase => {
    const next = setDraftPhase(get().draft, phase);
    set({ draft: next });
    void persistDraft(next);
  },

  completeFunnel: async () => {
    try {
      const { careInterests } = get().draft;
      const doneDraft = setDraftPhase(get().draft, 'done');
      set({ draft: doneDraft });
      await persistDraft(doneDraft);

      const currentSettings = useSettingsStore.getState().settings;
      if (!currentSettings) {
        // eslint-disable-next-line no-console
        console.error(
          '[onboardingDraftStore] completeFunnel error',
          'settings not loaded',
        );
        return;
      }

      await useSettingsStore.getState().updateSettings({
        ...currentSettings,
        careInterests: [...careInterests],
        onboardingCompleted: true,
      });

      await dataSource.clearDraft();
      set({ draft: createDefaultOnboardingDraft() });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[onboardingDraftStore] completeFunnel error', error);
    }
  },

  clear: async () => {
    try {
      await dataSource.clearDraft();
      set({ draft: createDefaultOnboardingDraft() });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[onboardingDraftStore] clear error', error);
    }
  },
}));
