import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type {
  NotificationsStackParamList,
  WellnessHubRootNavigation,
} from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { FlatTabHeroBar } from '../../../../shared/components/FlatTabHeroBar';
import { Paw3dIcon } from '../../../../shared/components/Paw3dIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAppSession } from '../../../../shared/session/useAppSession';
import { usePetStore } from '../../../pets/store/petStore';
import {
  aggregateCareDay,
  type CareAggregatedItem,
} from '../../domain/utils/careAggregator';
import { careTaskShortVerb } from '../../domain/utils/careTaskCopy';
import {
  getDayCompletion,
  isDayFullyComplete,
} from '../../domain/utils/wellnessCompletion';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useScheduleStore } from '../../store/scheduleStore';
import { CareAttentionCard } from '../components/CareAttentionCard';
import { CareDoneBurst } from '../components/CareDoneBurst';
import { CareFullDayCta } from '../components/CareFullDayCta';
import { CarePetFilter } from '../components/CarePetFilter';
import { CarePlayHud } from '../components/CarePlayHud';
import { CareUpNextList } from '../components/CareUpNextList';
import { CareBlockDetailSheet } from '../components/CareBlockDetailSheet';
import {
  type CareRewardKind,
  WellnessCompletionToast,
} from '../components/WellnessCompletionToast';

const LATER_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: 'In 30 minutes', minutes: 30 },
  { label: 'In 1 hour', minutes: 60 },
  { label: 'This evening', minutes: 180 },
];

type RewardToast = {
  petName: string;
  kind: CareRewardKind;
  streakDays: number;
  taskLabel?: string;
};

export const WellnessHubScreen: React.FC = () => {
  const navigation = useNavigation<WellnessHubRootNavigation>();
  const route = useRoute<RouteProp<NotificationsStackParamList, 'WellnessHub'>>();
  const tabBarInset = useAppTabBarInset();
  const theme = useTheme();
  const { colors, spacing, radius, textStyles, fontFamilies, shadows } = theme;
  const { plan } = useAppSession();
  const isPro = isScheduleProUser(plan);

  const pets = usePetStore(state => state.pets);
  const loadPets = usePetStore(state => state.loadPets);

  const careSchedulesByPetId = useScheduleStore(s => s.careSchedulesByPetId);
  const careFilterPetId = useScheduleStore(s => s.careFilterPetId);
  const careLoading = useScheduleStore(s => s.careLoading);
  const careStreakDays = useScheduleStore(s => s.careStreakDays);
  const error = useScheduleStore(s => s.error);
  const loadCareDaySchedules = useScheduleStore(s => s.loadCareDaySchedules);
  const setCareFilterPetId = useScheduleStore(s => s.setCareFilterPetId);
  const markCareBlockDone = useScheduleStore(s => s.markCareBlockDone);
  const skipCareBlock = useScheduleStore(s => s.skipCareBlock);
  const snoozeCareBlock = useScheduleStore(s => s.snoozeCareBlock);

  const [laterItem, setLaterItem] = useState<CareAggregatedItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<CareAggregatedItem | null>(
    null,
  );
  const [rewardToast, setRewardToast] = useState<RewardToast | null>(null);
  const [burstVisible, setBurstVisible] = useState(false);
  const [burstIntensity, setBurstIntensity] = useState<'soft' | 'day'>('soft');
  const [pulseToken, setPulseToken] = useState(0);

  const routePetId = route.params?.petId;

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await loadPets().catch(() => {});
        const latestPets = usePetStore.getState().pets;
        if (routePetId) {
          setCareFilterPetId(routePetId);
        } else if (latestPets.length === 1) {
          setCareFilterPetId(latestPets[0].id);
        } else {
          setCareFilterPetId('all');
        }
        if (latestPets.length > 0) {
          await loadCareDaySchedules(latestPets.map(pet => pet.id));
        }
      })();
    }, [loadCareDaySchedules, loadPets, routePetId, setCareFilterPetId]),
  );

  const carePets = useMemo(
    () =>
      pets.map(pet => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        photo: pet.photo,
      })),
    [pets],
  );

  const blocksByPetId = useMemo(() => {
    const map: Record<string, (typeof careSchedulesByPetId)[string]['blocks']> =
      {};
    for (const [petId, schedule] of Object.entries(careSchedulesByPetId)) {
      map[petId] = schedule.blocks;
    }
    return map;
  }, [careSchedulesByPetId]);

  const careView = useMemo(
    () =>
      aggregateCareDay({
        pets: carePets,
        blocksByPetId,
        filterPetId: careFilterPetId,
        now: new Date(),
        isPro,
        upNextLimit: 3,
        laterLimit: 0,
      }),
    [blocksByPetId, careFilterPetId, carePets, isPro],
  );

  const attentionCount = careView.openCount;
  const caption =
    pets.length === 0
      ? 'Add a pet to get started'
      : careFilterPetId === 'all'
        ? attentionCount > 0
          ? `${attentionCount} need${attentionCount === 1 ? 's' : ''} attention`
          : 'All pets'
        : pets.find(p => p.id === careFilterPetId)?.name ?? 'Care';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        content: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.lg,
        },
        filterWrap: { gap: spacing.sm },
        attentionWrap: {
          position: 'relative',
          overflow: 'visible',
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
        laterCancel: {
          alignSelf: 'center',
          minHeight: 44,
          justifyContent: 'center',
        },
        emptyCard: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
          padding: spacing.xl,
          gap: spacing.md,
          alignItems: 'flex-start',
        },
      }),
    [colors, radius, spacing],
  );

  const handleSeeFullDay = useCallback(() => {
    const petId =
      careFilterPetId === 'all' ? pets[0]?.id : careFilterPetId;
    if (!petId) {
      return;
    }
    // Stay on Care tab — DayView is in the Notifications stack.
    navigation.navigate('DayView', {
      petId,
    });
  }, [careFilterPetId, navigation, pets]);

  const handleMarkDone = useCallback(
    async (item: CareAggregatedItem) => {
      await markCareBlockDone(item.pet.id, item.block.id, true);
      const schedule =
        useScheduleStore.getState().careSchedulesByPetId[item.pet.id];
      const completion = schedule
        ? getDayCompletion(schedule.blocks, isPro)
        : { done: 0, total: 0, percentage: 0 };
      const dayDone = isDayFullyComplete(completion);
      const streak = useScheduleStore.getState().careStreakDays;
      setBurstIntensity(dayDone ? 'day' : 'soft');
      setBurstVisible(true);
      setPulseToken(token => token + 1);
      setRewardToast({
        petName: item.pet.name,
        kind: dayDone ? 'day' : 'task',
        streakDays: streak,
        taskLabel: careTaskShortVerb(item.block),
      });
      setLaterItem(null);
      setSelectedItem(null);
      setTimeout(() => setBurstVisible(false), dayDone ? 700 : 520);
    },
    [isPro, markCareBlockDone],
  );

  const attentionLocked =
    careView.attentionItem != null &&
    !careView.attentionItem.block.isFreeFeature &&
    !isPro;

  if (pets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatTabHeroBar title="Care" caption="Add a pet" theme={theme} />
        <View
          style={[
            styles.emptyCard,
            shadows.md,
            { margin: spacing.lg, paddingBottom: tabBarInset },
          ]}
        >
          <Paw3dIcon size={48} />
          <AppText
            style={[
              textStyles.title,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.extrabold,
                letterSpacing: -0.3,
              },
            ]}
          >
            Your pets need to be here
          </AppText>
          <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
            Add your first pet to start tracking their care.
          </AppText>
          <Button
            title="Add pet"
            onPress={() => navigation.navigate('PetsTab', { screen: 'AddPet' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatTabHeroBar title="Care" caption={caption} theme={theme} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}
      >
        <WellnessCompletionToast
          visible={rewardToast != null}
          petName={rewardToast?.petName ?? ''}
          rewardKind={rewardToast?.kind}
          streakDays={rewardToast?.streakDays}
          taskLabel={rewardToast?.taskLabel}
          onDismiss={() => setRewardToast(null)}
        />

        <View style={styles.filterWrap}>
          <CarePetFilter
            pets={pets}
            selectedId={
              pets.length === 1 ? pets[0].id : careFilterPetId
            }
            showAllChip={pets.length > 1}
            onSelect={id => {
              setCareFilterPetId(id);
            }}
          />
        </View>

        {careLoading && Object.keys(careSchedulesByPetId).length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}

        {error ? (
          <AppText style={[textStyles.body, { color: colors.danger }]}>
            {error}
          </AppText>
        ) : null}

        {!careLoading && careView.totalCount === 0 ? (
          <View style={[styles.emptyCard, shadows.sm]}>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              No care tasks yet
            </AppText>
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              Set a daily rhythm so we can show what needs attention.
            </AppText>
            <Button
              title="Set up care schedule"
              onPress={() => {
                const petId =
                  careFilterPetId === 'all' ? pets[0]?.id : careFilterPetId;
                if (!petId) {
                  return;
                }
                navigation.navigate('PetsTab', {
                  screen: 'ScheduleSetup',
                  params: { petId },
                });
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.attentionWrap}>
              <CareDoneBurst
                visible={burstVisible}
                intensity={burstIntensity}
              />
              <CareAttentionCard
                item={careView.attentionItem}
                allGood={careView.allGood}
                nextHint={careView.upNext[0] ?? null}
                locked={attentionLocked}
                onMarkDone={() => {
                  if (careView.attentionItem) {
                    void handleMarkDone(careView.attentionItem);
                  }
                }}
                onLater={() => setLaterItem(careView.attentionItem)}
                onUpgrade={() =>
                  navigation.navigate('SettingsTab', {
                    screen: 'Paywall',
                    params: { source: 'settings' },
                  })
                }
              />
            </View>

            {laterItem ? (
              <View style={styles.laterSheet}>
                <AppText
                  style={[
                    textStyles.caption,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamilies.semibold,
                    },
                  ]}
                >
                  Remind me
                </AppText>
                {LATER_PRESETS.map(preset => (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    style={styles.laterOption}
                    onPress={() => {
                      void snoozeCareBlock(
                        laterItem.pet.id,
                        laterItem.block.id,
                        preset.minutes,
                      );
                      setLaterItem(null);
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
                  style={styles.laterOption}
                  onPress={() => {
                    void skipCareBlock(laterItem.pet.id, laterItem.block.id);
                    setLaterItem(null);
                  }}
                >
                  <AppText
                    style={[
                      textStyles.caption,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Skip for today
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.laterCancel}
                  onPress={() => setLaterItem(null)}
                >
                  <AppText
                    style={[textStyles.caption, { color: colors.text.secondary }]}
                  >
                    Cancel
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <CareUpNextList
              title="Up next"
              items={careView.upNext}
              onSelect={setSelectedItem}
            />

            {careView.totalCount > 0 ? (
              <CareFullDayCta
                doneCount={careView.doneCount}
                totalCount={careView.totalCount}
                onPress={handleSeeFullDay}
              />
            ) : null}

            {careView.totalCount > 0 ? (
              <CarePlayHud
                doneCount={careView.doneCount}
                totalCount={careView.totalCount}
                streakDays={careStreakDays}
                pulseToken={pulseToken}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <CareBlockDetailSheet
        visible={selectedItem != null}
        block={selectedItem?.block ?? null}
        locked={
          selectedItem != null &&
          !selectedItem.block.isFreeFeature &&
          !isPro
        }
        onClose={() => setSelectedItem(null)}
        onMarkDone={() => {
          if (selectedItem) {
            void handleMarkDone(selectedItem);
          }
        }}
        onSkip={() => {
          if (selectedItem) {
            void skipCareBlock(selectedItem.pet.id, selectedItem.block.id);
            setSelectedItem(null);
          }
        }}
        onUpgrade={() =>
          navigation.navigate('SettingsTab', {
            screen: 'Paywall',
            params: { source: 'settings' },
          })
        }
      />
    </SafeAreaView>
  );
};

export default WellnessHubScreen;
