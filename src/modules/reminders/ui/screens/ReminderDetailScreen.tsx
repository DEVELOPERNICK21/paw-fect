import React, { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import type {
  ReminderDetailRootNavigation,
  RemindersStackParamList,
} from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { icons } from '../../../../shared/assets/icons';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../../pets/store/petStore';

const DEFAULT_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC4T6eRhkiOZPdpl07V4Q5wV6jkL73WtWv865dXMyC_LCdabfyMBnA8nnqKlwaTaYc50w-uH9jISkn0g-6VvT56t7XBnhl52Ct3dbrR3vTG-iGgXJJx_Y2gFyQ8KeIGu5rUE15weemEnWXOx3hqCKErqV3LyJohqMty6zhbH7qADyNlF9wUQP3zJLFNLA_AD1trh9WTvCYqxJ7uGYynvNdH7J87Ev23nr_6D9Vwf98Iq1qSSatYWugX9k9DCaSG27gv6bi_SK4Unvn0';

export const ReminderDetailScreen: React.FC = () => {
  const navigation = useNavigation<ReminderDetailRootNavigation>();
  const route = useRoute<RouteProp<RemindersStackParamList, 'ReminderDetail'>>();
  const { fontFamilies, colors } = useTheme();
  const { reminders, deleteReminder } = useReminderStore();
  const { pets, loadPets } = usePetStore();

  useEffect(() => {
    loadPets().catch(() => {});
  }, [loadPets]);

  const reminder = useMemo(
    () => reminders.find(item => item.id === route.params.reminderId),
    [reminders, route.params.reminderId],
  );
  const pet = useMemo(() => pets.find(item => item.id === reminder?.petId), [pets, reminder?.petId]);

  const handleDelete = async () => {
    if (!reminder) {
      navigation.goBack();
      return;
    }
    await deleteReminder(reminder.id);
    navigation.navigate('RemindersTab', { screen: 'ReminderList' });
  };

  if (!reminder) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { fontFamily: fontFamilies.medium }]}>Reminder not found.</Text>
          <Pressable style={styles.outlineBtn} onPress={() => navigation.goBack()}>
            <Text style={[styles.outlineText, { fontFamily: fontFamilies.bold }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundAlt }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>Reminder Details</Text>
          <Pressable style={styles.headerIcon}>
            <MaterialIcon name="more_vert" size={22} color={colors.text.heading} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.photoWrap}>
            <Image source={{ uri: pet?.photo ?? DEFAULT_PHOTO }} style={styles.photo} />
            <View style={styles.typeBadge}>
              <MaterialIcon name="vaccines" size={14} color={colors.text.inverse} />
            </View>
          </View>
          <Text style={[styles.reminderTitle, { fontFamily: fontFamilies.bold }]}>{reminder.title}</Text>
          <Text style={[styles.petName, { fontFamily: fontFamilies.semibold }]}>Pet: {pet?.name ?? 'Buddy'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}>Schedule Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon name="calendar_today" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { fontFamily: fontFamilies.bold }]}>Date</Text>
                <Text style={[styles.detailValue, { fontFamily: fontFamilies.medium }]}>{reminder.date}</Text>
              </View>
            </View>
            <MaterialIcon name="chevron_right" size={20} color={colors.accent} />
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon name="schedule" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { fontFamily: fontFamilies.bold }]}>Time</Text>
                <Text style={[styles.detailValue, { fontFamily: fontFamilies.medium }]}>{reminder.time}</Text>
              </View>
            </View>
            <MaterialIcon name="chevron_right" size={20} color={colors.accent} />
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon name="location_on" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { fontFamily: fontFamilies.bold }]}>Location</Text>
                <Text style={[styles.detailValue, { fontFamily: fontFamilies.medium }]}>Pawfect Veterinary Clinic</Text>
              </View>
            </View>
            <MaterialIcon name="map" size={20} color={colors.accent} />
          </View>

          <View style={styles.notesCard}>
            <Text style={[styles.notesTitle, { fontFamily: fontFamilies.bold }]}>Notes</Text>
            <Text style={[styles.notesBody, { fontFamily: fontFamilies.regular }]}>
              {reminder.notes || 'Remember to bring prior medical history and vaccination record book.'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('AddReminder')}>
            <icons.editPencil width={18} height={18} />
            <Text style={[styles.primaryText, { fontFamily: fontFamilies.bold }]}>Edit Reminder</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handleDelete}>
            <MaterialIcon name="delete" size={18} color={colors.text.body} />
            <Text style={[styles.secondaryText, { fontFamily: fontFamilies.bold }]}>Delete Reminder</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7F6' },
  content: { minHeight: 884, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(238,140,43,0.12)' },
  headerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 24, letterSpacing: -0.27, color: '#0F172A' },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, gap: 8 },
  photoWrap: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: 'rgba(238,140,43,0.2)' },
  photo: { width: 120, height: 120, borderRadius: 60 },
  typeBadge: { position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#EE8C2B', borderWidth: 2, borderColor: '#F8F7F6', alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { marginTop: 4, fontSize: 24, lineHeight: 32, letterSpacing: -0.36, color: '#0F172A', textAlign: 'center' },
  petName: { marginTop: 2, fontSize: 16, lineHeight: 24, color: '#EE8C2B' },
  section: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  sectionTitle: { fontSize: 18, lineHeight: 24, letterSpacing: -0.27, color: '#0F172A', marginBottom: 2 },
  detailCard: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(238,140,43,0.12)', backgroundColor: 'rgba(238,140,43,0.05)', paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  detailIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(238,140,43,0.2)', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 16, lineHeight: 22, color: '#0F172A' },
  detailValue: { marginTop: 2, fontSize: 14, lineHeight: 20, color: '#64748B' },
  notesCard: { marginTop: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(238,140,43,0.1)', backgroundColor: '#FFFFFF', padding: 14 },
  notesTitle: { fontSize: 16, lineHeight: 22, color: '#0F172A', marginBottom: 6 },
  notesBody: { fontSize: 14, lineHeight: 22, color: '#64748B' },
  footer: { marginTop: 16, paddingHorizontal: 16, gap: 10 },
  primaryBtn: { height: 56, borderRadius: 12, backgroundColor: '#EE8C2B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24 },
  secondaryBtn: { height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F8F7F6' },
  secondaryText: { color: '#64748B', fontSize: 16, lineHeight: 24 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12, backgroundColor: '#F8F7F6' },
  emptyText: { fontSize: 16, lineHeight: 24, color: '#64748B' },
  outlineBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: '#0F172A', fontSize: 15, lineHeight: 20 },
});

export default ReminderDetailScreen;
