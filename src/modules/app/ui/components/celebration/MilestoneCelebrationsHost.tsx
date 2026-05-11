import { CommonActions } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '../../../../auth/store/authStore';
import { usePetStore } from '../../../../pets/store/petStore';
import {
  useSmartHealthRecordStore,
  type MilestoneShareEvent,
} from '../../../../records/store/smartHealthRecordStore';
import { navigationRef } from '../../../../../app/navigation/navigationRef';
import { ShareMomentModal } from './ShareMomentModal';

type ActiveCelebration = {
  event: MilestoneShareEvent;
  petName: string;
};

/**
 * Listens for milestone share events from smart health completion and shows
 * a one-time modal per pet per app session. "Share" opens the health card share screen.
 */
export const MilestoneCelebrationsHost: React.FC = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const pets = usePetStore(s => s.pets);
  const milestoneEventCount = useSmartHealthRecordStore(
    s => s.milestoneEvents.length,
  );
  const [active, setActive] = useState<ActiveCelebration | null>(null);
  const shownPetIdsThisSession = useRef<Set<string>>(new Set());

  const tryShowNext = useCallback((): void => {
    if (active) {
      return;
    }
    if (!isAuthenticated) {
      return;
    }
    let event = useSmartHealthRecordStore.getState().consumeMilestoneEvent();
    while (event) {
      if (shownPetIdsThisSession.current.has(event.petId)) {
        event = useSmartHealthRecordStore.getState().consumeMilestoneEvent();
        continue;
      }
      const pet = pets.find(p => p.id === event.petId);
      if (!pet) {
        event = useSmartHealthRecordStore.getState().consumeMilestoneEvent();
        continue;
      }
      shownPetIdsThisSession.current.add(event.petId);
      setActive({
        event,
        petName: pet.name,
      });
      return;
    }
  }, [active, isAuthenticated, pets]);

  useEffect(() => {
    tryShowNext();
  }, [milestoneEventCount, tryShowNext]);

  useEffect(() => {
    if (!active) {
      tryShowNext();
    }
  }, [active, tryShowNext]);

  const navigateToShare = useCallback((petId: string): void => {
    if (!navigationRef.isReady()) {
      return;
    }
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'PetsTab',
        params: {
          screen: 'PetHealthCardShare',
          params: { petId },
        },
      }),
    );
  }, []);

  const handleShare = useCallback(() => {
    if (!active) {
      return;
    }
    navigateToShare(active.event.petId);
    setActive(null);
  }, [active, navigateToShare]);

  const handleNotNow = useCallback(() => {
    setActive(null);
  }, []);

  if (!active) {
    return null;
  }

  return (
    <ShareMomentModal
      visible
      petName={active.petName}
      kind={active.event.kind}
      onShare={handleShare}
      onNotNow={handleNotNow}
    />
  );
};
