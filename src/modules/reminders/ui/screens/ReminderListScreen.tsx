import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type {
  NotificationsStackParamList,
  ReminderListRootNavigation,
} from '../../../../app/navigation/types';
import {
  CompanionBubble,
  companionLines,
  MascotEmptyState,
  MascotErrorState,
} from '../../../../shared/components/Companion';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';
import type { Reminder } from '../../domain/models/Reminder';
import { useReminderStore } from '../../store/reminderStore';
import { useReminderSavedCheer } from '../hooks/useReminderSavedCheer';

const EMPTY_REMINDERS_LINES = companionLines({ scene: 'empty', kind: 'reminders' });
const ERROR_REMINDERS_LINES = companionLines({ scene: 'error', kind: 'reminders' });

const iconByType: Record<
  string,
  'vaccines' | 'pill' | 'content_cut' | 'stethoscope' | 'add_circle'
> = {
  vaccination: 'vaccines',
  medication: 'pill',
  grooming: 'content_cut',
  checkup: 'stethoscope',
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
      flexGrow: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      minHeight: 200,
    },
    card: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingLeft: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingRight: 8,
    },
    deleteBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent + '1F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    savedCheer: { marginBottom: 16 },
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
  const route = useRoute<RouteProp<NotificationsStackParamList, 'ReminderList'>>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors } = useTheme();
  const reminders = useReminderStore(s => s.reminders);
  const loading = useReminderStore(s => s.loading);
  const error = useReminderStore(s => s.error);
  const loadReminders = useReminderStore(s => s.loadReminders);
  const deleteReminder = useReminderStore(s => s.deleteReminder);

  const styles = useMemo(() => createStyles({ colors }), [colors]);
  const savedCheer = useReminderSavedCheer(route.params);

  const confirmDelete = useCallback(
    (reminderId: string, title: string) => {
      Alert.alert(
        'Delete reminder?',
        `Remove "${title}"? Scheduled alerts will be cancelled.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void deleteReminder(reminderId);
            },
          },
        ],
      );
    },
    [deleteReminder],
  );

  useEffect(() => {
    loadReminders().catch(() => {});
  }, [loadReminders]);

  const renderReminder = useCallback(
    ({ item: reminder }: { item: Reminder }) => (
      <View style={styles.card}>
        <Pressable
          style={styles.cardMain}
          onPress={() =>
            navigation.navigate('ReminderDetail', {
              reminderId: reminder.id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Open reminder ${reminder.title}`}
        >
          <View style={styles.iconWrap}>
            <MaterialIcon
              name={iconByType[reminder.type] ?? 'add_circle'}
              size={20}
              color={colors.accent}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, { fontFamily: fontFamilies.bold }]}>
              {reminder.title}
            </Text>
            <Text
              style={[styles.cardMeta, { fontFamily: fontFamilies.medium }]}
            >
              {reminder.date} • {reminder.time}
            </Text>
          </View>
          <MaterialIcon
            name="chevron_right"
            size={20}
            color={colors.text.subdued}
          />
        </Pressable>
        <Pressable
          style={styles.deleteBtn}
          onPress={() => confirmDelete(reminder.id, reminder.title)}
          accessibilityRole="button"
          accessibilityLabel={`Delete reminder ${reminder.title}`}
        >
          <MaterialIcon name="delete" size={20} color={colors.danger} />
        </Pressable>
      </View>
    ),
    [colors, confirmDelete, fontFamilies, navigation, styles],
  );

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <MascotErrorState
          title={ERROR_REMINDERS_LINES[0]}
          lines={[error]}
          onRetry={() => {
            loadReminders().catch(() => {});
          }}
          testID="reminders-error"
        />
      );
    }
    return (
      <MascotEmptyState
        title="No reminders yet"
        lines={EMPTY_REMINDERS_LINES}
        actionLabel="Add reminder"
        onAction={() => navigation.navigate('AddReminder')}
        testID="reminders-empty"
      />
    );
  }, [colors.primary, error, loadReminders, loading, navigation, styles]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate('NotificationInbox');
          }}
        >
          <MaterialIcon
            name="arrow_back"
            size={22}
            color={colors.text.heading}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>
          Your reminders
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddReminder')}
        >
          <MaterialIcon name="add" size={20} color={colors.text.inverse} />
        </Pressable>
      </View>

      <FlatList
        data={loading || error ? [] : reminders}
        keyExtractor={item => item.id}
        renderItem={renderReminder}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset + 12 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          savedCheer ? (
            <View style={styles.savedCheer}>
              <CompanionBubble
                species="dog"
                mood="happy"
                lines={companionLines({
                  scene: 'saved',
                  kind: 'reminder',
                  petName: savedCheer.petName,
                })}
                reactionRequest={savedCheer.request}
                testID="reminders-saved-cheer"
              />
            </View>
          ) : null
        }
        ListEmptyComponent={listEmpty}
      />
    </SafeAreaView>
  );
};

export default ReminderListScreen;
