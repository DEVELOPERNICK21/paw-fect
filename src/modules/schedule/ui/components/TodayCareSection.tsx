import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../pets/domain/models/Pet';
import { AppText } from '../../../../shared/components/AppText';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { isDayFullyComplete } from '../../domain/utils/wellnessCompletion';
import { useAppSession } from '../../../../shared/session/useAppSession';
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
  const { plan } = useAppSession();
  const isPro = isScheduleProUser(plan);
  const schedule = useScheduleStore(state => state.schedule);
  const loading = useScheduleStore(state => state.loading);
  const error = useScheduleStore(state => state.error);

  const enrichedBlocks = useWellnessStore(state => state.enrichedBlocks);
  const completion = useWellnessStore(state => state.completion);
  const streakDays = useWellnessStore(state => state.streakDays);
  const relaxedMode = useWellnessStore(state => state.relaxedMode);
  const heroBlockId = useWellnessStore(state => state.heroBlockId);
  const upNextBlocks = useWellnessStore(state => state.upNextBlocks);
  const selectedBlockId = useWellnessStore(state => state.selectedBlockId);
  const showCelebration = useWellnessStore(state => state.showCelebration);
  const celebrationPetName = useWellnessStore(state => state.celebrationPetName);
  const markTaskDone = useWellnessStore(state => state.markTaskDone);
  const skipTask = useWellnessStore(state => state.skipTask);
  const setSelectedBlockId = useWellnessStore(state => state.setSelectedBlockId);
  const clearCelebration = useWellnessStore(state => state.clearCelebration);

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
          isPro={isPro}
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
