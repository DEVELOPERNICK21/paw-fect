import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { PetsStackParamList, PetProfileRootNavigation } from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { usePetStore } from '../../../pets/store/petStore';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useSubscriptionStore } from '../../../subscription/store/subscriptionStore';
import { useScheduleStore } from '../../store/scheduleStore';

type WellnessRoute = RouteProp<PetsStackParamList, 'WellnessScore'>;

export const WellnessScoreScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const route = useRoute<WellnessRoute>();
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const entitlement = useSubscriptionStore(state => state.entitlement);
  const isPro = isScheduleProUser(entitlement.plan);
  const pet = usePetStore(state => state.pets.find(item => item.id === route.params.petId));
  const schedule = useScheduleStore(state => state.schedule);
  const loadDaySchedule = useScheduleStore(state => state.loadDaySchedule);

  useEffect(() => {
    void loadDaySchedule(route.params.petId);
  }, [loadDaySchedule, route.params.petId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.lg,
          gap: spacing.sm,
        },
        card: {
          margin: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.xl,
          gap: spacing.md,
        },
      }),
    [colors, radius, spacing],
  );

  if (!isPro) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
          </Pressable>
          <AppText style={[textStyles.title, { color: colors.text.heading }]}>
            Wellness report is part of Pawfect+
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
        </Pressable>
        <AppText
          style={[
            textStyles.title,
            { color: colors.text.heading, fontFamily: fontFamilies.bold },
          ]}
        >
          Weekly report
        </AppText>
      </View>
      <ScrollView>
        <View style={styles.card}>
          <AppText
            style={[
              textStyles.title,
              { color: colors.text.heading, fontFamily: fontFamilies.bold },
            ]}
          >
            {pet?.name ?? 'Pet'}&apos;s weekly report
          </AppText>
          <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
            Wellness score: {schedule?.wellnessScore ?? 0}/100
          </AppText>
          <AppText style={[textStyles.body, { color: colors.text.secondary }]}>
            Care streak: {schedule?.streakDays ?? 0} days
          </AppText>
          {!isPro ? (
            <AppText style={[textStyles.footer, { color: colors.text.subdued }]}>
              Made with Pawfect
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WellnessScoreScreen;
