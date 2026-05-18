import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { PetsStackParamList, PetProfileRootNavigation } from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { usePetStore } from '../../../pets/store/petStore';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useScheduleStore } from '../../store/scheduleStore';
import { CareBlockDetailSheet } from '../components/CareBlockDetailSheet';
import { DayCareTimeline } from '../components/DayCareTimeline';
import { formatScheduleDateLabel } from '../utils/scheduleDisplay';

type DayViewRoute = RouteProp<PetsStackParamList, 'DayView'>;

export const DayViewScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const route = useRoute<DayViewRoute>();
  const tabBarInset = useAppTabBarInset();
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = useTheme();
  const entitlement = useSubscriptionStore(state => state.entitlement);
  const isPro = isScheduleProUser(entitlement.plan);
  const pets = usePetStore(state => state.pets);
  const activePetId = usePetStore(state => state.activePetId);
  const schedule = useScheduleStore(state => state.schedule);
  const loading = useScheduleStore(state => state.loading);
  const error = useScheduleStore(state => state.error);
  const selectedBlockId = useScheduleStore(state => state.selectedBlockId);
  const loadDaySchedule = useScheduleStore(state => state.loadDaySchedule);
  const markBlockDone = useScheduleStore(state => state.markBlockDone);
  const snoozeBlock = useScheduleStore(state => state.snoozeBlock);
  const setSelectedBlockId = useScheduleStore(state => state.setSelectedBlockId);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const petId = route.params?.petId ?? activePetId ?? pets[0]?.id;
  const pet = pets.find(item => item.id === petId);

  useEffect(() => {
    if (petId) {
      void loadDaySchedule(petId);
    }
  }, [loadDaySchedule, petId]);

  useEffect(() => {
    if (route.params?.blockId) {
      setExpandedBlockId(route.params.blockId);
      setSelectedBlockId(route.params.blockId);
    }
  }, [route.params?.blockId, setSelectedBlockId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.sm,
        },
        headerTitle: { flex: 1, gap: spacing.xxs },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        iconBtn: {
          width: spacing['2xl'] + spacing.xs,
          height: spacing['2xl'] + spacing.xs,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        summaryCard: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.md,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.lg,
          gap: spacing.md,
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.md,
        },
        statChip: {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceAlt,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          gap: spacing.xxs,
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
        content: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          gap: spacing.lg,
        },
        empty: {
          padding: spacing.xl,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
      }),
    [colors, radius, spacing],
  );

  const currentBlockId = useMemo(() => {
    if (!schedule) {
      return null;
    }
    const upcoming = schedule.blocks.find(block => !block.isCompleted);
    return upcoming?.id ?? null;
  }, [schedule]);

  const selectedBlock = useMemo(
    () => schedule?.blocks.find(block => block.id === selectedBlockId) ?? null,
    [schedule, selectedBlockId],
  );

  const handleOpenSetup = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('ScheduleSetup', { petId });
  }, [navigation, petId]);

  const handleOpenWeek = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('ScheduleWeekView', { petId });
  }, [navigation, petId]);

  const handleOpenWellness = useCallback(() => {
    if (!petId) {
      return;
    }
    navigation.navigate('WellnessScore', { petId });
  }, [navigation, petId]);

  const handleUpgrade = useCallback(() => {
    navigation.navigate('Paywall', { source: 'settings' });
  }, [navigation]);

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

  if (!petId || !pet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.empty}>
          <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
            This pet&apos;s record no longer exists.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.heading} />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {pet.name}&apos;s Day
          </AppText>
          <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
            {schedule ? formatScheduleDateLabel(schedule.date) : 'Today'}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleOpenWeek} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcon name="calendar_today" size={18} color={colors.text.heading} />
          </Pressable>
          <Pressable onPress={handleOpenWellness} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcon name="analytics" size={18} color={colors.text.heading} />
          </Pressable>
          <Pressable onPress={handleOpenSetup} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcon name="settings" size={18} color={colors.text.heading} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.summaryCard, shadows.sm]}>
        <View style={styles.summaryRow}>
          <View style={styles.statChip}>
            <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
              Streak
            </AppText>
            <AppText
              style={[
                textStyles.body,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {schedule?.streakDays ?? 0} days
            </AppText>
          </View>
          <View style={styles.statChip}>
            <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
              Today
            </AppText>
            <AppText
              style={[
                textStyles.body,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              {schedule?.completionPercent ?? 0}%
            </AppText>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${schedule?.completionPercent ?? 0}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <AppText style={[textStyles.body, { color: colors.danger }]}>{error}</AppText>
        ) : null}

        {schedule ? (
          <DayCareTimeline
            blocks={schedule.blocks}
            currentBlockId={currentBlockId}
            expandedBlockId={expandedBlockId}
            isPro={isPro}
            onToggleExpand={handleToggleExpand}
            onToggleComplete={handleToggleComplete}
            onSnooze={handleSnooze}
            onOpenActions={handleOpenActions}
          />
        ) : null}
      </ScrollView>

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
        onUpgrade={handleUpgrade}
      />
    </SafeAreaView>
  );
};

export default DayViewScreen;
