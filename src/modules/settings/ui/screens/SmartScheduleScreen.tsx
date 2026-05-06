import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { SettingsRootNavigation } from '../../../../app/navigation/types';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { spacing } from '../../../../shared/theme/spacing';
import { radius } from '../../../../shared/theme/radius';
import { fontSizes, lineHeights } from '../../../../shared/theme/typography';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';

const dogSchedule = [
  'Meal reminder: daily at 8:00 AM',
  'Activity reminder: walk at 6:00 PM',
  'Grooming reminder: weekly on Sunday at 10:00 AM',
];

const catSchedule = [
  'Meal reminder: daily at 8:00 AM',
  'Activity reminder: play/enrichment at 8:00 PM',
  'Grooming reminder: weekly on Saturday at 11:00 AM',
];

const tips = [
  'Use this as a starter template, then personalize by age and vet advice.',
  'Dogs usually need structured walks; cats need short, frequent play.',
  'Bathing frequency differs by breed and coat type.',
];

export const SmartScheduleScreen: React.FC = () => {
  const navigation = useNavigation<SettingsRootNavigation>();
  const { colors, fontFamilies } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
          Smart daily schedule
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: fontFamilies.bold }]}>For dogs</Text>
          {dogSchedule.map(item => (
            <Text key={item} style={[styles.itemLine, { fontFamily: fontFamilies.medium }]}>
              - {item}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: fontFamilies.bold }]}>For cats</Text>
          {catSchedule.map(item => (
            <Text key={item} style={[styles.itemLine, { fontFamily: fontFamilies.medium }]}>
              - {item}
            </Text>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={[styles.noteTitle, { fontFamily: fontFamilies.bold }]}>Smart tips</Text>
          {tips.map(item => (
            <Text key={item} style={[styles.noteText, { fontFamily: fontFamilies.medium }]}>
              - {item}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.backgroundAlt,
    },
    headerBtn: {
      width: spacing['3xl'],
      height: spacing['3xl'],
      borderRadius: radius.round,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.xl,
      color: colors.text.heading,
      marginRight: spacing['3xl'],
    },
    headerSpacer: { width: spacing['3xl'], height: spacing['3xl'] },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      color: colors.text.heading,
    },
    itemLine: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.md,
      color: colors.text.body,
    },
    noteCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.primaryLight,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    noteTitle: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.heading,
    },
    noteText: {
      fontSize: fontSizes.sm,
      lineHeight: lineHeights.md,
      color: colors.text.body,
    },
  });

export default SmartScheduleScreen;
