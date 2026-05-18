import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Pet } from '../../../pets/domain/models/Pet';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { CareBlockDetailSheet } from './CareBlockDetailSheet';
import { DayCareTimeline } from './DayCareTimeline';
import {
  TodayCareCompleteCard,
  TodayCareLoadingPlaceholder,
  TodayCareSetupPlaceholder,
} from './TodayCarePlaceholderCards';
import { formatScheduleDateLabel } from '../utils/scheduleDisplay';
import { todayGreeting } from '../utils/todayGreeting';

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
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = useTheme();
  const entitlement = useSubscriptionStore(state => state.entitlement);
  const isPro = isScheduleProUser(entitlement.plan);
  const schedule = useScheduleStore(state => state.schedule);
  const loading = useScheduleStore(state => state.loading);
  const error = useScheduleStore(state => state.error);
  const selectedBlockId = useScheduleStore(state => state.selectedBlockId);
  const markBlockDone = useScheduleStore(state => state.markBlockDone);
  const snoozeBlock = useScheduleStore(state => state.snoozeBlock);
  const setSelectedBlockId = useScheduleStore(state => state.setSelectedBlockId);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: spacing.lg,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        streakPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.round,
          backgroundColor: colors.brandTint10,
        },
        summaryCard: {
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        progressTrack: {
          height: spacing.sm,
          borderRadius: radius.round,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.primary,
        },
        timelineWrap: {
          gap: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  const currentBlockId = useMemo(() => {
    if (!schedule) {
      return null;
    }
    return schedule.blocks.find(block => !block.isCompleted)?.id ?? null;
  }, [schedule]);

  const selectedBlock = useMemo(
    () => schedule?.blocks.find(block => block.id === selectedBlockId) ?? null,
    [schedule, selectedBlockId],
  );

  const completedCount = schedule?.blocks.filter(block => block.isCompleted).length ?? 0;
  const totalCount = schedule?.blocks.length ?? 0;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const handleToggleExpand = useCallback((blockId: string) => {
    setExpandedBlockId(current => (current === blockId ? null : blockId));
  }, []);

  const handleToggleComplete = useCallback(
    (blockId: string, completed: boolean) => {
      void markBlockDone(blockId, completed);
    },
    [markBlockDone],
  );

  const handleOpenActions = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId);
    },
    [setSelectedBlockId],
  );

  const handleSnooze = useCallback(
    (blockId: string) => {
      void snoozeBlock(blockId, 30);
    },
    [snoozeBlock],
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText
            style={[
              textStyles.caption,
              { color: colors.text.secondary, fontFamily: fontFamilies.semibold },
            ]}
          >
            Today&apos;s care
          </AppText>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {todayGreeting()}
          </AppText>
          <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
            {schedule ? formatScheduleDateLabel(schedule.date) : 'Today'}
          </AppText>
        </View>
        <View style={styles.streakPill}>
          <MaterialIcon name="pets" size={16} color={colors.primary} />
          <AppText
            style={[
              textStyles.caption,
              { color: colors.primary, fontFamily: fontFamilies.semibold },
            ]}
          >
            {schedule?.streakDays ?? 0} day streak
          </AppText>
        </View>
      </View>

      <View style={[styles.summaryCard, shadows.sm]}>
        <AppText
          style={[
            textStyles.body,
            { color: colors.text.heading, fontFamily: fontFamilies.semibold },
          ]}
        >
          {pet.name}&apos;s care {completedCount}/{totalCount || 0} done
        </AppText>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${schedule?.completionPercent ?? 0}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.timelineWrap}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <AppText style={[textStyles.body, { color: colors.danger }]}>{error}</AppText>
        ) : null}

        {!loading && totalCount === 0 ? (
          <TodayCareSetupPlaceholder petName={pet.name} onPressSetup={onOpenSetup} />
        ) : null}

        {!loading && allComplete ? (
          <TodayCareCompleteCard
            petName={pet.name}
            completionPercent={schedule?.completionPercent ?? 100}
          />
        ) : null}

        {!loading && totalCount > 0 && !allComplete ? (
          <DayCareTimeline
            blocks={schedule?.blocks ?? []}
            currentBlockId={currentBlockId}
            expandedBlockId={expandedBlockId}
            isPro={isPro}
            onToggleExpand={handleToggleExpand}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
            onOpenActions={handleOpenActions}
          />
        ) : null}

        {loading && totalCount === 0 ? <TodayCareLoadingPlaceholder /> : null}
      </View>

      <CareBlockDetailSheet
        visible={selectedBlockId != null}
        block={selectedBlock}
        locked={selectedBlock != null && !selectedBlock.isFreeFeature && !isPro}
        onClose={() => setSelectedBlockId(null)}
        onMarkDone={() => {
          if (selectedBlockId) {
            void markBlockDone(selectedBlockId, true);
            setSelectedBlockId(null);
          }
        }}
        onSnooze={() => {
          if (selectedBlockId) {
            void snoozeBlock(selectedBlockId, 30);
            setSelectedBlockId(null);
          }
        }}
        onUpgrade={onUpgrade}
      />
    </View>
  );
};
