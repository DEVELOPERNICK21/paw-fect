import { create } from 'zustand';

import { trackEvent } from '../../../infrastructure/analytics/analytics';
import type {
  OnboardingDraft,
  OnboardingPhase,
} from '../domain/onboarding/OnboardingDraft';
import { buildOnboardingProfile } from '../domain/onboarding/buildOnboardingProfile';
import { normalizeOnboardingDraft } from '../domain/onboarding/normalizeOnboardingDraft';
import {
  advanceStep,
  createDefaultOnboardingDraft,
  setPhase as setDraftPhase,
} from '../domain/onboarding/onboardingDraftReducers';
import { onboardingComposition } from '../onboardingComposition';
import {
  getOnboardingActivationPort,
  getOnboardingSettingsPort,
} from './onboardingCoordinationPorts';

export type OnboardingDraftReducer = (draft: OnboardingDraft) => OnboardingDraft;

const retreatStep = (draft: OnboardingDraft): OnboardingDraft => ({
  ...draft,
  step: Math.max(draft.step - 1, 0),
});

export type PersistFirstWinResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export interface OnboardingDraftState {
  draft: OnboardingDraft;
  hydrate: () => Promise<void>;
  save: () => Promise<void>;
  update: (reducer: OnboardingDraftReducer) => void;
  goNext: () => void;
  goBack: () => void;
  setPhase: (phase: OnboardingPhase) => void;
  startActivation: () => void;
  persistFirstWin: (userId: string) => Promise<PersistFirstWinResult>;
  completeFunnel: () => Promise<void>;
  clear: () => Promise<void>;
}

const persistDraft = async (draft: OnboardingDraft): Promise<void> => {
  await onboardingComposition.saveOnboardingDraft.execute(draft);
};

export const useOnboardingDraftStore = create<OnboardingDraftState>((set, get) => ({
  draft: createDefaultOnboardingDraft(),

  hydrate: async () => {
    try {
      const raw = await onboardingComposition.getOnboardingDraft.execute();
      const draft = normalizeOnboardingDraft(raw);
      set({ draft });
    } catch (error) {
      console.error('[onboardingDraftStore] hydrate error', error);
    }
  },

  save: async () => {
    try {
      await persistDraft(get().draft);
    } catch (error) {
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

  startActivation: () => {
    get().update(draft => ({ ...draft, phase: 'activate', step: 0 }));
  },

  persistFirstWin: async (userId: string) => {
    const draft = get().draft;
    if (!draft.petDraft || !draft.reminderDraft) {
      return { ok: false, errorMessage: 'Add your pet and a reminder first.' };
    }
    const port = getOnboardingActivationPort();
    let petId = draft.createdPetId;
    if (!petId) {
      const petResult = await port.createPetFromDraft({
        userId,
        pet: draft.petDraft,
      });
      if (!petResult.ok) {
        void trackEvent('onboarding_persist_failed', { stage: 'pet' });
        return petResult;
      }
      petId = petResult.petId;
      get().update(d => ({ ...d, createdPetId: petId }));
    }
    const rem = await port.createReminderFromDraft({
      petId,
      reminder: draft.reminderDraft,
    });
    if (!rem.ok) {
      void trackEvent('onboarding_persist_failed', { stage: 'reminder' });
      return rem;
    }
    void trackEvent('onboarding_first_win_created', {
      reminder_kind: draft.reminderDraft.kind,
      species: draft.petDraft.species,
    });
    get().setPhase('paywall');
    return { ok: true };
  },

  completeFunnel: async () => {
    try {
      const draft = get().draft;
      const onboardingProfile = buildOnboardingProfile(draft);
      const persisted = await getOnboardingSettingsPort().persistOnboardingCompletion(
        {
          careInterests: [...draft.careInterests],
          onboardingProfile,
        },
      );
      if (!persisted) {
        console.error(
          '[onboardingDraftStore] completeFunnel error',
          'settings update did not persist onboarding profile',
        );
        return;
      }

      void trackEvent('onboarding_draft_persisted', {
        hasNickname: Boolean(onboardingProfile.pet.nickname.trim()),
        paywallOutcome: onboardingProfile.paywallOutcome,
      });

      await onboardingComposition.clearOnboardingDraft.execute();
      set({ draft: createDefaultOnboardingDraft() });
    } catch (error) {
      console.error('[onboardingDraftStore] completeFunnel error', error);
    }
  },

  clear: async () => {
    try {
      await onboardingComposition.clearOnboardingDraft.execute();
      set({ draft: createDefaultOnboardingDraft() });
    } catch (error) {
      console.error('[onboardingDraftStore] clear error', error);
    }
  },
}));
