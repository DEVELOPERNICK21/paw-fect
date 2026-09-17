import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type {
  AppTabParamList,
  NotificationsStackParamList,
  PetsStackParamList,
} from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { Paw3dIcon } from '../../../../shared/components/Paw3dIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAppSession } from '../../../../shared/session/useAppSession';
import { usePetStore } from '../../../pets/store/petStore';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { chronologicalCareItems } from '../../domain/utils/careAggregator';
import { useScheduleStore } from '../../store/scheduleStore';
import { CareBlockDetailSheet } from '../components/CareBlockDetailSheet';
import { CareDayPath } from '../components/CareDayPath';
import { formatScheduleDateLabel } from '../utils/scheduleDisplay';

type DayViewRoute =
  | RouteProp<PetsStackParamList, 'DayView'>
  | RouteProp<NotificationsStackParamList, 'DayView'>;

type DayViewNav = CompositeNavigationProp<
  NativeStackNavigationProp<
    PetsStackParamList & NotificationsStackParamList,
    'DayView'
  >,
  BottomTabNavigationProp<AppTabParamList>
>;

export const DayViewScreen: React.FC = () => {
  const navigation = useNavigation<DayViewNav>();
  const route = useRoute<DayViewRoute>();
  const tabBarInset = useAppTabBarInset();
  const { height: windowHeight } = useWindowDimensions();
  const { colors, spacing, radius, textStyles, fontFamilies, shadows, isDarkMode } =
    useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { plan } = useAppSession();
  const isPro = isScheduleProUser(plan);
  const pets = usePetStore(state => state.pets);
  const activePet = usePetStore(state => state.activePet);
  const careSchedulesByPetId = useScheduleStore(
    state => state.careSchedulesByPetId,
  );
  const careFilterPetId = useScheduleStore(state => state.careFilterPetId);
  const careLoading = useScheduleStore(state => state.careLoading);
  const careStreakDays = useScheduleStore(state => state.careStreakDays);
  const error = useScheduleStore(state => state.error);
  const selectedBlockId = useScheduleStore(state => state.selectedBlockId);
  const loadCareDaySchedules = useScheduleStore(
    state => state.loadCareDaySchedules,
  );
  const markCareBlockDone = useScheduleStore(state => state.markCareBlockDone);
  const snoozeCareBlock = useScheduleStore(state => state.snoozeCareBlock);
  const setSelectedBlockId = useScheduleStore(
    state => state.setSelectedBlockId,
  );

  const routePetId = route.params?.petId ?? activePet?.id ?? pets[0]?.id;
  const filterPetId =
    careFilterPetId === 'all' && pets.length > 1 ? 'all' : routePetId ?? 'all';

  useEffect(() => {
    if (pets.length > 0) {
      void loadCareDaySchedules(pets.map(pet => pet.id));
    }
  }, [loadCareDaySchedules, pets]);

  useEffect(() => {
    if (route.params?.blockId) {
      setSelectedBlockId(route.params.blockId);
    }
  }, [route.params?.blockId, setSelectedBlockId]);

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
    for (const [id, schedule] of Object.entries(careSchedulesByPetId)) {
      map[id] = schedule.blocks;
    }
    return map;
  }, [careSchedulesByPetId]);

  const dayItems = useMemo(
    () =>
      chronologicalCareItems({
        pets: carePets,
        blocksByPetId,
        filterPetId: filterPetId === 'all' ? 'all' : (filterPetId as string),
        now: new Date(),
        isPro,
      }),
    [blocksByPetId, carePets, filterPetId, isPro],
  );

  const doneCount = dayItems.filter(item => item.urgency === 'done').length;

  const selectedItem = useMemo(() => {
    if (!selectedBlockId) {
      return null;
    }
    return dayItems.find(item => item.block.id === selectedBlockId) ?? null;
  }, [dayItems, selectedBlockId]);

  const headerTitle =
    filterPetId === 'all'
      ? "Today's path"
      : `${pets.find(p => p.id === filterPetId)?.name ?? 'Pet'}'s path`;

  const dateLabel = Object.values(careSchedulesByPetId)[0]?.date;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        skyLayer: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        safeArea: { flex: 1, backgroundColor: 'transparent' },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.sm,
        },
        headerTitle: { flex: 1, gap: spacing.xxs },
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
        content: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          gap: spacing.lg,
        },
        summary: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.brandTint20,
          backgroundColor: colors.surface,
        },
        summaryText: { flex: 1, gap: 2, minWidth: 0 },
        phaseChip: {
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          borderWidth: 1,
        },
        empty: {
          padding: spacing.xl,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          gap: spacing.sm,
        },
      }),
    [colors, radius, spacing],
  );

  const nightOpacity = scrollY.interpolate({
    inputRange: [
      0,
      Math.max(windowHeight * 0.35, 180),
      Math.max(windowHeight * 0.75, 360),
    ],
    outputRange: [0, 0.55, 1],
    extrapolate: 'clamp',
  });

  const [skyPhase, setSkyPhase] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>(
    'Morning',
  );

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (value < windowHeight * 0.2) {
        setSkyPhase('Morning');
      } else if (value < windowHeight * 0.45) {
        setSkyPhase('Afternoon');
      } else if (value < windowHeight * 0.7) {
        setSkyPhase('Evening');
      } else {
        setSkyPhase('Night');
      }
    });
    return () => {
      scrollY.removeListener(id);
    };
  }, [scrollY, windowHeight]);

  const handleOpenSetup = useCallback(() => {
    const target = filterPetId === 'all' ? routePetId : filterPetId;
    if (!target) {
      return;
    }
    navigation.navigate('PetsTab', {
      screen: 'ScheduleSetup',
      params: { petId: target },
    });
  }, [filterPetId, navigation, routePetId]);

  if (pets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.empty}>
          <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
            Add a pet to see today&apos;s schedule.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Day base sky */}
      <LinearGradient
        colors={
          isDarkMode
            ? ['#5A4A3A', '#3D4558', '#2A3348']
            : ['#FFD9A8', '#B8D9F5', '#DCEAF8']
        }
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.skyLayer}
        pointerEvents="none"
      />
      {/* Night veil deepens as you scroll the day schedule */}
      <Animated.View
        pointerEvents="none"
        style={[styles.skyLayer, { opacity: nightOpacity }]}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ['#2A3348', '#121826', '#0A0F1C']
              : ['#5A6F9A', '#2A3A5C', '#1A2440']
          }
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.skyLayer}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcon name="arrow_back" size={20} color={colors.text.heading} />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText
            style={[
              textStyles.subtitle,
              {
                color: colors.text.heading,
                fontFamily: fontFamilies.extrabold,
                letterSpacing: -0.2,
              },
            ]}
          >
            {headerTitle}
          </AppText>
          <AppText style={[textStyles.caption, { color: colors.text.secondary }]}>
            {dateLabel ? formatScheduleDateLabel(dateLabel) : 'Today'}
          </AppText>
        </View>
        <Pressable
          onPress={handleOpenSetup}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Care schedule settings"
        >
          <MaterialIcon name="settings" size={18} color={colors.text.heading} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {careLoading && dayItems.length === 0 ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {error ? (
          <AppText style={[textStyles.body, { color: colors.danger }]}>
            {error}
          </AppText>
        ) : null}

        <View style={[styles.summary, shadows.sm]}>
          <Paw3dIcon size={28} />
          <View style={styles.summaryText}>
            <AppText
              style={[
                textStyles.caption,
                {
                  color: colors.text.heading,
                  fontFamily: fontFamilies.bold,
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {doneCount} of {dayItems.length} stops done
            </AppText>
            <AppText
              style={[textStyles.footer, { color: colors.text.secondary }]}
            >
              {careStreakDays > 0
                ? `${careStreakDays}-day streak · follow the path`
                : 'Follow the path · morning to night'}
            </AppText>
            <View
              style={[
                styles.phaseChip,
                {
                  marginTop: spacing.xs,
                  backgroundColor: colors.brandTint12,
                  borderColor: colors.brandTint20,
                },
              ]}
            >
              <AppText
                style={[
                  textStyles.footer,
                  {
                    color: colors.accent,
                    fontFamily: fontFamilies.bold,
                    letterSpacing: 0.4,
                  },
                ]}
              >
                {skyPhase} sky
              </AppText>
            </View>
          </View>
        </View>

        {dayItems.length === 0 ? (
          <View style={styles.empty}>
            <AppText
              style={[
                textStyles.subtitle,
                { color: colors.text.heading, fontFamily: fontFamilies.bold },
              ]}
            >
              No stops today
            </AppText>
            <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
              Set up a care schedule to build today&apos;s path.
            </AppText>
          </View>
        ) : (
          <CareDayPath
            items={dayItems}
            onSelect={item => setSelectedBlockId(item.block.id)}
            onMarkDone={item => {
              void markCareBlockDone(item.pet.id, item.block.id, true);
            }}
          />
        )}
      </Animated.ScrollView>

      <CareBlockDetailSheet
        visible={selectedItem != null}
        block={selectedItem?.block ?? null}
        locked={
          selectedItem != null &&
          !selectedItem.block.isFreeFeature &&
          !isPro
        }
        onClose={() => {
          setSelectedBlockId(null);
        }}
        onMarkDone={() => {
          if (selectedItem) {
            void markCareBlockDone(
              selectedItem.pet.id,
              selectedItem.block.id,
              true,
            );
            setSelectedBlockId(null);
          }
        }}
        onSnooze={() => {
          if (selectedItem) {
            void snoozeCareBlock(
              selectedItem.pet.id,
              selectedItem.block.id,
              30,
            );
            setSelectedBlockId(null);
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
    </View>
  );
};

export default DayViewScreen;
