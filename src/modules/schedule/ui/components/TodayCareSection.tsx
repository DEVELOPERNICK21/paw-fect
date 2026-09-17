import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

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
import { CareSimpleList } from './CareSimpleList';
import {
  TodayCareCompleteCard,
  TodayCareLoadingPlaceholder,
  TodayCareSetupPlaceholder,
} from './TodayCarePlaceholderCards';
import { WellnessCompletionToast } from './WellnessCompletionToast';
import { WellnessTabHeader } from './WellnessTabHeader';

export interface TodayCareSectionProps {
  pet: Pet;
  onOpenSetup: () => void;
  onUpgrade: () => void;
  onSeeFullDay: () => void;
}

const LATER_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: 'In 30 minutes', minutes: 30 },
  { label: 'In 1 hour', minutes: 60 },
  { label: 'This evening', minutes: 180 },
];

export const TodayCareSection: React.FC<TodayCareSectionProps> = ({
  pet,
  onOpenSetup,
  onUpgrade,
  onSeeFullDay,
}) => {
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const { plan } = useAppSession();
  const isPro = isScheduleProUser(plan);
  const schedule = useScheduleStore(state => state.schedule);
  const loading = useScheduleStore(state => state.loading);
  const error = useScheduleStore(state => state.error);
  const markBlockDone = useScheduleStore(state => state.markBlockDone);
  const skipBlock = useScheduleStore(state => state.skipBlock);
  const snoozeBlock = useScheduleStore(state => state.snoozeBlock);

  const enrichedBlocks = useWellnessStore(state => state.enrichedBlocks);
  const completion = useWellnessStore(state => state.completion);
  const streakDays = useWellnessStore(state => state.streakDays);
  const heroBlockId = useWellnessStore(state => state.heroBlockId);
  const upNextBlocks = useWellnessStore(state => state.upNextBlocks);
  const laterBlocks = useWellnessStore(state => state.laterBlocks);
  const selectedBlockId = useWellnessStore(state => state.selectedBlockId);
  const showCelebration = useWellnessStore(state => state.showCelebration);
  const celebrationPetName = useWellnessStore(state => state.celebrationPetName);
  const hydrateDay = useWellnessStore(state => state.hydrateDay);
  const setSelectedBlockId = useWellnessStore(state => state.setSelectedBlockId);
  const clearCelebration = useWellnessStore(state => state.clearCelebration);
  const [laterPickerBlockId, setLaterPickerBlockId] = useState<string | null>(
    null,
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
        laterSheet: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        laterOption: {
          minHeight: 48,
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceAlt,
        },
        seeFullDay: {
          alignSelf: 'center',
          minHeight: 48,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
      }),
    [colors, radius, spacing],
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
    loading ||
    (schedule != null &&
      schedule.blocks.length > 0 &&
      enrichedBlocks.length === 0);

  const rehydrateFromSchedule = useCallback(async () => {
    const latest = useScheduleStore.getState().schedule;
    const prefs = useScheduleStore.getState().preferences;
    if (!latest || latest.petId !== pet.id) {
      return;
    }
    await hydrateDay({
      petId: pet.id,
      petName: pet.name,
      species: pet.type,
      blocks: latest.blocks,
      date: latest.date,
      isPro,
      ownerSleepTime: prefs?.ownerSleepTime ?? '22:30',
    });
  }, [hydrateDay, isPro, pet.id, pet.name, pet.type]);

  const handleMarkDone = useCallback(
    async (blockId: string) => {
      await markBlockDone(blockId, true);
      await rehydrateFromSchedule();
      const { completion: next, petName } = useWellnessStore.getState();
      if (isDayFullyComplete(next)) {
        useWellnessStore.setState({
          showCelebration: true,
          celebrationPetName: petName || pet.name,
        });
      }
    },
    [markBlockDone, pet.name, rehydrateFromSchedule],
  );

  const handleSkip = useCallback(
    async (blockId: string) => {
      await skipBlock(blockId);
      await rehydrateFromSchedule();
    },
    [rehydrateFromSchedule, skipBlock],
  );

  const handleLaterPreset = useCallback(
    async (blockId: string, minutes: number) => {
      await snoozeBlock(blockId, minutes);
      setLaterPickerBlockId(null);
      await rehydrateFromSchedule();
    },
    [rehydrateFromSchedule, snoozeBlock],
  );

  return (
    <View style={styles.section}>
      <WellnessCompletionToast
        visible={showCelebration}
        petName={celebrationPetName ?? pet.name}
        onDismiss={clearCelebration}
      />

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
          <AppText style={[textStyles.body, { color: colors.danger }]}>
            {error}
          </AppText>
        ) : null}

        {!isHydrating && totalCount === 0 ? (
          <TodayCareSetupPlaceholder
            petName={pet.name}
            onPressSetup={onOpenSetup}
          />
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
              petName={pet.name}
              locked={heroBlock != null && !heroBlock.isFreeFeature && !isPro}
              onMarkDone={() => {
                if (heroBlock) {
                  void handleMarkDone(heroBlock.id);
                }
              }}
              onLater={() => {
                if (heroBlock) {
                  setLaterPickerBlockId(heroBlock.id);
                }
              }}
              onUpgrade={onUpgrade}
            />

            {laterPickerBlockId ? (
              <View style={styles.laterSheet}>
                <AppText
                  style={[
                    textStyles.subtitle,
                    {
                      color: colors.text.heading,
                      fontFamily: fontFamilies.extrabold,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Remind me
                </AppText>
                {LATER_PRESETS.map(preset => (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityLabel={preset.label}
                    style={styles.laterOption}
                    onPress={() => {
                      void handleLaterPreset(laterPickerBlockId, preset.minutes);
                    }}
                  >
                    <AppText
                      style={[
                        textStyles.caption,
                        {
                          color: colors.text.heading,
                          fontFamily: fontFamilies.semibold,
                        },
                      ]}
                    >
                      {preset.label}
                    </AppText>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Skip for today"
                  style={styles.laterOption}
                  onPress={() => {
                    void handleSkip(laterPickerBlockId);
                    setLaterPickerBlockId(null);
                  }}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamilies.semibold,
                      },
                    ]}
                  >
                    Skip for today
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLaterPickerBlockId(null)}
                  style={styles.seeFullDay}
                >
                  <AppText
                    style={[textStyles.caption, { color: colors.text.secondary }]}
                  >
                    Cancel
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <CareSimpleList
              title="Up next"
              petName={pet.name}
              blocks={upNextBlocks}
              onSelectBlock={setSelectedBlockId}
            />
            <CareSimpleList
              title="Later"
              petName={pet.name}
              blocks={laterBlocks}
              onSelectBlock={setSelectedBlockId}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See full day"
              onPress={onSeeFullDay}
              style={styles.seeFullDay}
            >
              <AppText
                style={[
                  textStyles.caption,
                  { color: colors.accent, fontFamily: fontFamilies.semibold },
                ]}
              >
                See full day
              </AppText>
            </Pressable>
          </>
        ) : null}

        {!isHydrating && allComplete && totalCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See full day"
            onPress={onSeeFullDay}
            style={styles.seeFullDay}
          >
            <AppText
              style={[
                textStyles.caption,
                { color: colors.accent, fontFamily: fontFamilies.semibold },
              ]}
            >
              See full day
            </AppText>
          </Pressable>
        ) : null}

        {isHydrating && totalCount === 0 ? <TodayCareLoadingPlaceholder /> : null}
      </View>

      <CareBlockDetailSheet
        visible={selectedBlockId != null}
        block={selectedBlock}
        locked={
          selectedBlock != null && !selectedBlock.isFreeFeature && !isPro
        }
        onClose={() => setSelectedBlockId(null)}
        onMarkDone={() => {
          if (selectedBlockId) {
            void handleMarkDone(selectedBlockId);
            setSelectedBlockId(null);
          }
        }}
        onSkip={() => {
          if (selectedBlockId) {
            void handleSkip(selectedBlockId);
            setSelectedBlockId(null);
          }
        }}
        onUpgrade={onUpgrade}
      />
    </View>
  );
};
