import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import {
  BuddyBondBar,
  BuddyWalkPath,
  CompanionBubble,
  companionLines,
} from '../../../../../shared/components/Companion';
import { titleForLevel } from '../../../../../shared/companion/buddyBond';
import {
  useBondProgress,
  useBuddyBondStore,
} from '../../../../schedule/store/buddyBondStore';
import { useScheduleStore } from '../../../../schedule/store/scheduleStore';
import { mascotMoodForHome } from '../../../domain/mascot/mascotMood';
import type { HomeDashboardViewModel } from '../../../domain/models/HomeDashboardViewModel';
import { daysUntilDate } from '../../../domain/utils/homeDashboardDates';
import { useActiveMascotSpecies } from '../../hooks/useActiveMascotSpecies';

export interface HomeCompanionProps {
  viewModel: HomeDashboardViewModel;
  paused?: boolean;
}

const LEVEL_UP_SHOWN_MS = 9000;

/**
 * The app character on Home, as a small game loop:
 *  - it greets you for the day's state (overdue, coming up, all done, night...),
 *  - it walks toward a treat as today's tasks get done,
 *  - your bond with it levels up as you keep caring (and it celebrates).
 */
export const HomeCompanion: React.FC<HomeCompanionProps> = ({
  viewModel,
  paused,
}) => {
  const species = useActiveMascotSpecies();
  const now = useMemo(() => new Date(viewModel.now), [viewModel.now]);
  const mood = mascotMoodForHome(viewModel, now);
  const petName = viewModel.activePet?.name ?? 'your pet';

  const streakDays = useScheduleStore(s => s.careStreakDays);
  const bond = useBondProgress();
  const pendingLevelUp = useBuddyBondStore(s => s.pendingLevelUp);
  const dismissLevelUp = useBuddyBondStore(s => s.dismissLevelUp);

  useEffect(() => {
    if (pendingLevelUp == null) return undefined;
    const t = setTimeout(dismissLevelUp, LEVEL_UP_SHOWN_MS);
    return () => clearTimeout(t);
  }, [pendingLevelUp, dismissLevelUp]);

  const done = viewModel.todayCare.filter(i => i.showCompletedCheck).length;
  const total = viewModel.todayCare.length;

  const lines = useMemo(() => {
    if (pendingLevelUp != null) {
      return companionLines({
        scene: 'levelup',
        level: pendingLevelUp,
        title: titleForLevel(pendingLevelUp),
        petName,
      });
    }
    const milestone = viewModel.nextMilestone;
    return companionLines({
      scene: 'home',
      mood,
      petName,
      overdueCount: viewModel.actionHealthItems.filter(
        item => item.urgency === 'overdue',
      ).length,
      nextLabel: milestone?.title,
      nextDays: milestone ? daysUntilDate(milestone.dueDateYmd, now) : undefined,
      hour: now.getHours(),
    });
  }, [pendingLevelUp, mood, viewModel, now, petName]);

  const caption = companionLines({
    scene: 'walk',
    petName,
    done,
    total,
    streakDays,
  })[0];

  return (
    <View style={{ gap: 12 }} testID="home-companion">
      <CompanionBubble
        species={species}
        mood={pendingLevelUp != null ? 'celebrating' : mood}
        lines={lines}
        paused={paused}
        reactionRequest={
          pendingLevelUp != null
            ? { reaction: 'celebrate', id: `levelup-${pendingLevelUp}` }
            : null
        }
      />
      <BuddyWalkPath
        species={species}
        doneCount={done}
        totalCount={total}
        caption={caption}
        paused={paused}
        testID="home-walk-path"
      />
      <BuddyBondBar progress={bond} streakDays={streakDays} testID="home-bond-bar" />
    </View>
  );
};
