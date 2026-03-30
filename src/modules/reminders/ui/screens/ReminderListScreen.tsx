import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { ReminderListRootNavigation } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import { useReminderStore } from '../../store/reminderStore';

const iconByType: Record<
  string,
  'vaccines' | 'pill' | 'content_cut' | 'add_circle'
> = {
  vaccination: 'vaccines',
  medication: 'pill',
  grooming: 'content_cut',
  other: 'add_circle',
};

const createStyles = ({ colors }: Pick<Theme, 'colors'>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.27,
      color: colors.text.heading,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 12,
    },
    emptyState: {
      marginTop: 80,
      borderRadius: 16,
      backgroundColor: colors.surface,
      padding: 20,
      alignItems: 'center',
    },
    emptyTitle: { fontSize: 20, lineHeight: 26, color: colors.text.heading },
    emptySubtitle: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    primaryBtn: {
      marginTop: 16,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: colors.text.inverse,
      fontSize: 15,
      lineHeight: 20,
    },
    card: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent + '1F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    cardTitle: { color: colors.text.heading, fontSize: 15, lineHeight: 20 },
    cardMeta: {
      marginTop: 2,
      color: colors.text.secondary,
      fontSize: 13,
      lineHeight: 18,
    },
  });

export const ReminderListScreen: React.FC = () => {
  const navigation = useNavigation<ReminderListRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const { reminders, loadReminders } = useReminderStore();

  const styles = useMemo(() => createStyles({ colors }), [colors]);

  useEffect(() => {
    loadReminders().catch(() => {});
  }, [loadReminders]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
        >
          <MaterialIcon
            name="arrow_back"
            size={22}
            color={colors.text.heading}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
          Reminders
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReminder')}
        >
          <MaterialIcon name="add" size={20} color={colors.text.inverse} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyTitle, { fontFamily: fontFamilies.bold }]}
            >
              No reminders yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { fontFamily: fontFamilies.medium },
              ]}
            >
              Add your first reminder to keep pet care on track.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('AddReminder')}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  { fontFamily: fontFamilies.bold },
                ]}
              >
                Create Reminder
              </Text>
            </Pressable>
          </View>
        ) : (
          reminders.map(reminder => (
            <Pressable
              key={reminder.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('ReminderDetail', {
                  reminderId: reminder.id,
                })
              }
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconWrap}>
                  <MaterialIcon
                    name={iconByType[reminder.type] ?? 'add_circle'}
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.textWrap}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { fontFamily: fontFamilies.bold },
                    ]}
                  >
                    {reminder.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardMeta,
                      { fontFamily: fontFamilies.medium },
                    ]}
                  >
                    {reminder.date} • {reminder.time}
                  </Text>
                </View>
              </View>
              <MaterialIcon
                name="chevron_right"
                size={20}
                color={colors.text.subdued}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReminderListScreen;
