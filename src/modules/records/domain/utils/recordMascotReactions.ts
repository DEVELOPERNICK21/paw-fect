import type {
  MascotReaction,
  MascotReactionRequest,
} from '../../../../shared/components/Mascot/mascotTypes';

/**
 * Which mascot reaction opening a pet's health record deserves. Pure: no React, no animation code.
 * (Opening a screen is a navigation fact, not a store event, so there is no event hub here:
 * the screen's focus is the event, tracked by {@link stepHealthRecordOpen}.)
 */
export function mascotReactionForRecordOpen(): MascotReaction {
  return 'curious';
}

export interface HealthRecordOpenState {
  /** The pet whose record has already been announced during this focus, if any. */
  announcedPetId: string | null;
  /** How many opens have been announced; makes every request id unique. */
  opens: number;
}

export const INITIAL_HEALTH_RECORD_OPEN_STATE: HealthRecordOpenState = {
  announcedPetId: null,
  opens: 0,
};

export interface HealthRecordOpenStep {
  state: HealthRecordOpenState;
  /** Set only on the step where a new open should be reacted to. */
  request: MascotReactionRequest | null;
}

/**
 * Decides when "the user opened a pet's health record" happened:
 * - once each time the screen gains focus with a pet to show;
 * - again if the pet being shown changes while the screen stays focused;
 * - never while unfocused, never twice for the same focus, and not until there is a pet.
 */
export function stepHealthRecordOpen(
  prev: HealthRecordOpenState,
  input: { focused: boolean; petId: string | null },
): HealthRecordOpenStep {
  if (!input.focused) {
    return { state: { ...prev, announcedPetId: null }, request: null };
  }
  if (input.petId == null || prev.announcedPetId === input.petId) {
    return { state: prev, request: null };
  }
  const opens = prev.opens + 1;
  return {
    state: { announcedPetId: input.petId, opens },
    request: {
      reaction: mascotReactionForRecordOpen(),
      id: `health-record-open:${input.petId}:${opens}`,
    },
  };
}
