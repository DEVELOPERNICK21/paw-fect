import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
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
  NotificationsStackParamList,
  ReminderDetailRootNavigation,
} from '../../../../app/navigation/types';
import { useAppTabBarInset } from '../../../../app/navigation/layout';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import type { ReminderRepeat, ReminderType } from '../../domain/models/Reminder';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../../pets/store/petStore';
import type { IconName } from '../../../../shared/components/MaterialIcon';
import { resolvePetAvatarSource } from '../../../../shared/utils/petDisplayPhoto';

const TYPE_ICON: Record<ReminderType, IconName> = {
  vaccination: 'vaccines',
  medication: 'pill',
  grooming: 'content_cut',
  checkup: 'stethoscope',
  other: 'add_circle',
};

const REPEAT_LABEL: Record<ReminderRepeat, string> = {
  once: 'One time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Every year',
};

const createStyles = ({ colors }: Pick<Theme, 'colors'>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
    content: { paddingBottom: 24 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent + '1F',
    },
    headerIcon: {
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
    hero: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      gap: 8,
    },
    photoWrap: {
      width: 128,
      height: 128,
      borderRadius: 64,
      borderWidth: 4,
      borderColor: colors.accent + '33',
    },
    photo: { width: 120, height: 120, borderRadius: 60 },
    typeBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reminderTitle: {
      marginTop: 4,
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.36,
      color: colors.text.heading,
      textAlign: 'center',
    },
    petName: {
      marginTop: 2,
      fontSize: 16,
      lineHeight: 24,
      color: colors.accent,
    },
    section: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    sectionTitle: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.27,
      color: colors.text.heading,
      marginBottom: 2,
    },
    detailCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent + '1F',
      backgroundColor: colors.accent + '0D',
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    detailLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    detailIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.accent + '33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailLabel: { fontSize: 16, lineHeight: 22, color: colors.text.heading },
    detailValue: {
      marginTop: 2,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    notesCard: {
      marginTop: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent + '1A',
      backgroundColor: colors.surface,
      padding: 14,
    },
    notesTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.text.heading,
      marginBottom: 6,
    },
    notesBody: { fontSize: 14, lineHeight: 22, color: colors.text.secondary },
    footer: { marginTop: 16, paddingHorizontal: 16, gap: 10 },
    primaryBtn: {
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryText: { color: colors.text.inverse, fontSize: 16, lineHeight: 24 },
    secondaryBtn: {
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.danger + '55',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.backgroundAlt,
    },
    secondaryText: {
      color: colors.danger,
      fontSize: 16,
      lineHeight: 24,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 12,
      backgroundColor: colors.backgroundAlt,
    },
    emptyText: { fontSize: 16, lineHeight: 24, color: colors.text.secondary },
    outlineBtn: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineText: { color: colors.text.heading, fontSize: 15, lineHeight: 20 },
  });

export const ReminderDetailScreen: React.FC = () => {
  const navigation = useNavigation<ReminderDetailRootNavigation>();
  const route =
    useRoute<RouteProp<NotificationsStackParamList, 'ReminderDetail'>>();
  const { fontFamilies, colors } = useTheme();
  const tabBarInset = useAppTabBarInset();
  const reminders = useReminderStore(s => s.reminders);
  const deleteReminder = useReminderStore(s => s.deleteReminder);
  const loadReminders = useReminderStore(s => s.loadReminders);
  const pets = usePetStore(s => s.pets);
  const loadPets = usePetStore(s => s.loadPets);

  const styles = useMemo(() => createStyles({ colors }), [colors]);

  useEffect(() => {
    loadPets().catch(() => {});
    loadReminders().catch(() => {});
  }, [loadPets, loadReminders]);

  const reminder = useMemo(
    () => reminders.find(item => item.id === route.params.reminderId),
    [reminders, route.params.reminderId],
  );
  const pet = useMemo(
    () => pets.find(item => item.id === reminder?.petId),
    [pets, reminder?.petId],
  );

  const confirmDelete = useCallback(async () => {
    if (!reminder) {
      navigation.goBack();
      return;
    }
    await deleteReminder(reminder.id);
    navigation.navigate('ReminderList');
  }, [deleteReminder, navigation, reminder]);

  const handleDelete = useCallback(() => {
    if (!reminder) {
      return;
    }
    Alert.alert(
      'Delete reminder?',
      `Remove "${reminder.title}"? Scheduled alerts will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void confirmDelete();
          },
        },
      ],
    );
  }, [confirmDelete, reminder]);

  if (!reminder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { fontFamily: fontFamilies.medium }]}>
            Reminder not found.
          </Text>
          <Pressable
            style={styles.outlineBtn}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={[styles.outlineText, { fontFamily: fontFamilies.bold }]}
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcon
              name="arrow_back"
              size={22}
              color={colors.text.heading}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
            Reminder
          </Text>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.hero}>
          <View style={styles.photoWrap}>
            <Image
              source={resolvePetAvatarSource({
                type: pet?.type ?? 'dog',
                photo: pet?.photo,
              })}
              style={styles.photo}
            />
            <View style={styles.typeBadge}>
              <MaterialIcon
                name={TYPE_ICON[reminder.type] ?? 'add_circle'}
                size={14}
                color={colors.text.inverse}
              />
            </View>
          </View>
          <Text
            style={[styles.reminderTitle, { fontFamily: fontFamilies.bold }]}
          >
            {reminder.title}
          </Text>
          <Text style={[styles.petName, { fontFamily: fontFamilies.semibold }]}>
            Pet: {pet?.name ?? 'Buddy'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontFamily: fontFamilies.bold }]}
          >
            Schedule Details
          </Text>
          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon
                  name="calendar_today"
                  size={18}
                  color={colors.accent}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.detailLabel,
                    { fontFamily: fontFamilies.bold },
                  ]}
                >
                  Date
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { fontFamily: fontFamilies.medium },
                  ]}
                >
                  {reminder.date}
                </Text>
              </View>
            </View>
            <MaterialIcon
              name="chevron_right"
              size={20}
              color={colors.accent}
            />
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon name="schedule" size={18} color={colors.accent} />
              </View>
              <View>
                <Text
                  style={[
                    styles.detailLabel,
                    { fontFamily: fontFamilies.bold },
                  ]}
                >
                  Time
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { fontFamily: fontFamilies.medium },
                  ]}
                >
                  {reminder.time}
                </Text>
              </View>
            </View>
            <MaterialIcon
              name="chevron_right"
              size={20}
              color={colors.accent}
            />
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconWrap}>
                <MaterialIcon name="repeat" size={18} color={colors.accent} />
              </View>
              <View>
                <Text
                  style={[
                    styles.detailLabel,
                    { fontFamily: fontFamilies.bold },
                  ]}
                >
                  Repeats
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { fontFamily: fontFamilies.medium },
                  ]}
                >
                  {REPEAT_LABEL[reminder.repeat] ?? reminder.repeat}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.notesCard}>
            <Text
              style={[styles.notesTitle, { fontFamily: fontFamilies.bold }]}
            >
              Notes
            </Text>
            <Text
              style={[styles.notesBody, { fontFamily: fontFamilies.regular }]}
            >
              {reminder.notes.trim()
                ? reminder.notes
                : 'No notes added.'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('AddReminder')}
          >
            <MaterialIcon name="add" size={18} color={colors.text.inverse} />
            <Text
              style={[styles.primaryText, { fontFamily: fontFamilies.bold }]}
            >
              Add another reminder
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handleDelete}>
            <MaterialIcon name="delete" size={18} color={colors.danger} />
            <Text
              style={[styles.secondaryText, { fontFamily: fontFamilies.bold }]}
            >
              Delete Reminder
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReminderDetailScreen;
