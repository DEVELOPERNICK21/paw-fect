import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type { PetsStackParamList, PetProfileRootNavigation } from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { isScheduleProUser } from '../../domain/models/ScheduleFeatureGates';
import { useAppSession } from '../../../../shared/session/useAppSession';
import { useScheduleStore } from '../../store/scheduleStore';

type WeekRoute = RouteProp<PetsStackParamList, 'ScheduleWeekView'>;

export const ScheduleWeekViewScreen: React.FC = () => {
  const navigation = useNavigation<PetProfileRootNavigation>();
  const route = useRoute<WeekRoute>();
  const { colors, spacing, radius, textStyles, fontFamilies } = useTheme();
  const { plan } = useAppSession();
  const isPro = isScheduleProUser(plan);
  const weekScores = useScheduleStore(state => state.weekScores);
  const loadWeekScores = useScheduleStore(state => state.loadWeekScores);

  useEffect(() => {
    if (isPro) {
      void loadWeekScores(route.params.petId);
    }
  }, [isPro, loadWeekScores, route.params.petId]);

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
        grid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: spacing.lg,
          gap: spacing.sm,
        },
        dot: {
          width: spacing.xl,
          height: spacing.xl,
          borderRadius: radius.round,
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
            Week view is part of Pawsoul+
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
          Week view
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {weekScores.map(item => (
          <View key={item.date} style={{ alignItems: 'center', gap: spacing.xs }}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    item.percent >= 80
                      ? colors.success
                      : item.percent >= 50
                        ? colors.warning
                        : colors.danger,
                },
              ]}
            />
            <AppText style={[textStyles.footer, { color: colors.text.secondary }]}>
              {item.percent}%
            </AppText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScheduleWeekViewScreen;
