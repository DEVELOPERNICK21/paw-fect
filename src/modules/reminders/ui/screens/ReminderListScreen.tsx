import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { ReminderListRootNavigation } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useReminderStore } from '../../store/reminderStore';

const iconByType: Record<string, 'vaccines' | 'pill' | 'content_cut' | 'add_circle'> = {
  vaccination: 'vaccines',
  medication: 'pill',
  grooming: 'content_cut',
  other: 'add_circle',
};

export const ReminderListScreen: React.FC = () => {
  const navigation = useNavigation<ReminderListRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const { reminders, loadReminders } = useReminderStore();

  useEffect(() => {
    loadReminders().catch(() => {});
  }, [loadReminders]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
        >
          <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>Reminders</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('AddReminder')}
        >
          <MaterialIcon name="add" size={20} color={colors.text.inverse} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { fontFamily: fontFamilies.bold }]}>No reminders yet</Text>
            <Text style={[styles.emptySubtitle, { fontFamily: fontFamilies.medium }]}>
              Add your first reminder to keep pet care on track.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('AddReminder')}>
              <Text style={[styles.primaryBtnText, { fontFamily: fontFamilies.bold }]}>Create Reminder</Text>
            </Pressable>
          </View>
        ) : (
          reminders.map(reminder => (
            <Pressable
              key={reminder.id}
              style={styles.card}
              onPress={() => navigation.navigate('ReminderDetail', { reminderId: reminder.id })}
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
                  <Text style={[styles.cardTitle, { fontFamily: fontFamilies.bold }]}>{reminder.title}</Text>
                  <Text style={[styles.cardMeta, { fontFamily: fontFamilies.medium }]}>
                    {reminder.date} • {reminder.time}
                  </Text>
                </View>
              </View>
              <MaterialIcon name="chevron_right" size={20} color={colors.text.subdued} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 24, letterSpacing: -0.27, color: '#0F172A' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EE8C2B', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 12 },
  emptyState: { marginTop: 80, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 20, lineHeight: 26, color: '#0F172A' },
  emptySubtitle: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#64748B', textAlign: 'center' },
  primaryBtn: { marginTop: 16, height: 48, borderRadius: 12, backgroundColor: '#EE8C2B', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20 },
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(238,140,43,0.12)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  cardTitle: { color: '#0F172A', fontSize: 15, lineHeight: 20 },
  cardMeta: { marginTop: 2, color: '#64748B', fontSize: 13, lineHeight: 18 },
});

export default ReminderListScreen;
