import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import type { Pet } from '../../../pets/domain/models/Pet';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { isDayFullyComplete } from '../../domain/utils/wellnessCompletion';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { useWellnessStore } from '../../store/wellnessStore';
import { ActiveBlockCard } from './ActiveBlockCard';
import { CareBlockDetailSheet } from './CareBlockDetailSheet';
import { FullDayScheduleSection } from './FullDayScheduleSection';
import {
  TodayCareCompleteCard,
  TodayCareLoadingPlaceholder,
  TodayCareSetupPlaceholder,
} from './TodayCarePlaceholderCards';
import { UpNextList } from './UpNextList';
import { WellnessCompletionToast } from './WellnessCompletionToast';
import { WellnessConfettiBurst } from './WellnessConfettiBurst';
import { WellnessTabHeader } from './WellnessTabHeader';

export interface TodayCareSectionProps {
  pet: Pet;
  onOpenSetup: () => void;
  onUpgrade: () => void;
}

export const TodayCareSection: React.FC<TodayCareSectionProps> = ({
  pet,
  onOpenSetup,
  onUpgrade,
}) => {
  const { colors, spacing, textStyles } = useTheme();
  const entitlement = useSubscriptionStore(state => state.entitlement);
  const isPro = isScheduleProUser(entitlement.plan);

  const { schedule, loading, error } = useScheduleStore(
    useShallow(state => ({
      schedule: state.schedule,
      loading: state.loading,
      error: state.error,
    })),
  );

  const {
    enrichedBlocks,
    completion,
    streakDays,
    relaxedMode,
    heroBlockId,
    upNextBlocks,
    selectedBlockId,
    showCelebration,
    celebrationPetName,
    markTaskDone,
    skipTask,
    setSelectedBlockId,
    clearCelebration,
  } = useWellnessStore(
    useShallow(state => ({
      enrichedBlocks: state.enrichedBlocks,
      completion: state.completion,
      streakDays: state.streakDays,
      relaxedMode: state.relaxedMode,
      heroBlockId: state.heroBlockId,
      upNextBlocks: state.upNextBlocks,
      selectedBlockId: state.selectedBlockId,
      showCelebration: state.showCelebration,
      celebrationPetName: state.celebrationPetName,
      markTaskDone: state.markTaskDone,
      skipTask: state.skipTask,
      setSelectedBlockId: state.setSelectedBlockId,
      clearCelebration: state.clearCelebration,
    })),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: spacing.lg,
          position: 'relative',
        },
        body: {
          gap: spacing.lg,
        },
      }),
    [spacing],
  );

  const heroBlock = useMemo(
    () => enrichedBlocks.find(block => block.id === heroBlockId) ?? null,
    [enrichedBlocks, heroBlockId],
  );

  const selectedBlock = useMemo(
    () => enrichedBlocks.find(block => block.id === selectedBlockId) ?? null,
    [enrichedBlocks, selectedBlockId],
  );

  const totalCount = enrichedBlocks.length;
  const allComplete = isDayFullyComplete(completion);
  const date = schedule?.date ?? new Date().toISOString().slice(0, 10);
  const isHydrating =
    loading || (schedule != null && schedule.blocks.length > 0 && enrichedBlocks.length === 0);

  const handleMarkDone = useCallback(
    (blockId: string) => {
      void markTaskDone(pet.id, blockId, date);
    },
    [date, markTaskDone, pet.id],
  );

  const handleSkip = useCallback(
    (blockId: string) => {
      void skipTask(pet.id, blockId, date);
    },
    [date, pet.id, skipTask],
  );

  return (
    <View style={styles.section}>
      <WellnessCompletionToast
        visible={showCelebration}
        petName={celebrationPetName ?? pet.name}
        onDismiss={clearCelebration}
      />
      <WellnessConfettiBurst visible={showCelebration} />

      {schedule ? (
        <WellnessTabHeader
          petName={pet.name}
          date={schedule.date}
          completion={completion}
          streakDays={streakDays}
        />
      ) : null}

      <View style={styles.body}>
        {isHydrating ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <AppText style={[textStyles.body, { color: colors.danger }]}>{error}</AppText>
        ) : null}

        {!isHydrating && totalCount === 0 ? (
          <TodayCareSetupPlaceholder petName={pet.name} onPressSetup={onOpenSetup} />
        ) : null}

        {!isHydrating && allComplete && totalCount > 0 ? (
          <TodayCareCompleteCard
            petName={pet.name}
            completionPercent={completion.percentage}
          />
        ) : null}

        {!isHydrating && totalCount > 0 && !allComplete ? (
          <>
            <ActiveBlockCard
              block={heroBlock}
              locked={heroBlock != null && !heroBlock.isFreeFeature && !isPro}
              onMarkDone={() => {
                if (heroBlock) {
                  handleMarkDone(heroBlock.id);
                }
              }}
              onSkip={() => {
                if (heroBlock) {
                  handleSkip(heroBlock.id);
                }
              }}
              onUpgrade={onUpgrade}
            />
            <UpNextList blocks={upNextBlocks} onSelectBlock={setSelectedBlockId} />
            <FullDayScheduleSection
              blocks={enrichedBlocks}
              isPro={isPro}
              relaxedMode={relaxedMode}
              petName={pet.name}
              completion={completion}
              onUpgrade={onUpgrade}
            />
          </>
        ) : null}

        {isHydrating && totalCount === 0 ? <TodayCareLoadingPlaceholder /> : null}
      </View>

      <CareBlockDetailSheet
        visible={selectedBlockId != null}
        block={selectedBlock}
        locked={selectedBlock != null && !selectedBlock.isFreeFeature && !isPro}
        onClose={() => setSelectedBlockId(null)}
        onMarkDone={() => {
          if (selectedBlockId) {
            handleMarkDone(selectedBlockId);
            setSelectedBlockId(null);
          }
        }}
        onSkip={() => {
          if (selectedBlockId) {
            handleSkip(selectedBlockId);
            setSelectedBlockId(null);
          }
        }}
        onUpgrade={onUpgrade}
      />
    </View>
  );
};
