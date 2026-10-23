import { useEffect, useRef, useState } from 'react';

import type { MascotReactionRequest } from '../../../../../shared/components/Mascot';

/** Reminder step of the activation flow; arriving there means the pet was just named. */
const FIRST_REMINDER_STEP = 1;

/**
 * How the onboarding companion responds to the user, like a tutor reacting to answers:
 * - `welcome` when the pet has a name and the reminder step opens ("Nice to meet Bruno!");
 * - `success` each time the current step becomes complete (a valid answer).
 * Each request has a fresh id, so it plays once; leaving a step clears it.
 */
export function useActivationCompanionReaction(
  step: number,
  isStepValid: boolean,
): MascotReactionRequest | null {
  const [request, setRequest] = useState<MascotReactionRequest | null>(null);
  const count = useRef(0);
  const wasValid = useRef(isStepValid);
  const lastStep = useRef(step);

  useEffect(() => {
    if (lastStep.current !== step) {
      lastStep.current = step;
      wasValid.current = isStepValid;
      count.current += 1;
      setRequest(
        step === FIRST_REMINDER_STEP
          ? { reaction: 'welcome', id: `activation-${step}-enter-${count.current}` }
          : null,
      );
      return;
    }
    if (isStepValid && !wasValid.current) {
      count.current += 1;
      setRequest({ reaction: 'success', id: `activation-${step}-valid-${count.current}` });
    }
    wasValid.current = isStepValid;
  }, [step, isStepValid]);

  return request;
}
