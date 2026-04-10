import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type {
  AppTabParamList,
  NotificationsStackParamList,
} from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';

import {
  selectVisibleFeedItems,
  useNotificationFeedStore,
  type InAppNotificationFeedItem,
} from '../../store/notificationFeedStore';

type InboxNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<NotificationsStackParamList, 'NotificationInbox'>,
  BottomTabNavigationProp<AppTabParamList>
>;

const createStyles = ({ colors, spacing, radius }: Pick<Theme, 'colors' | 'spacing' | 'radius'>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      flex: 1,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text.heading,
    },
    remindersLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    remindersLinkText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.accent,
    },
    list: { flex: 1 },
    row: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    rowBody: { flex: 1, gap: 4 },
    rowTitle: { fontSize: 15, lineHeight: 20, color: colors.text.heading },
    rowSubtitle: { fontSize: 13, lineHeight: 18, color: colors.text.secondary },
    rowMeta: { fontSize: 12, lineHeight: 16, color: colors.text.subdued },
    empty: {
      marginHorizontal: spacing.lg,
      marginTop: spacing['3xl'],
      padding: spacing.xl,
      borderRadius: radius.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyTitle: { fontSize: 18, color: colors.text.heading, textAlign: 'center' },
    emptyBody: { fontSize: 14, color: colors.text.secondary, textAlign: 'center' },
  });

function formatWhen(item: InAppNotificationFeedItem): string {
  if (item.deliveredAt != null) {
    const d = new Date(item.deliveredAt);
    return `Shown ${d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
  }
  if (item.scheduledFor != null) {
    const d = new Date(item.scheduledFor);
    return `Scheduled ${d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
  }
  const d = new Date(item.loggedAt);
  return `Logged ${d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
}

export const NotificationInboxScreen: React.FC = () => {
  const navigation = useNavigation<InboxNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const itemsById = useNotificationFeedStore(s => s.itemsById);
  const visible = useMemo(() => selectVisibleFeedItems(itemsById), [itemsById]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: InAppNotificationFeedItem }) => (
      <Pressable
        style={[
          styles.row,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => {
          navigation.navigate('NotificationDetail', { notificationId: item.id });
        }}
      >
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: item.read ? 'transparent' : colors.accent },
          ]}
        />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { fontFamily: fontFamilies.semibold }]}>
            {item.title.length > 0 ? item.title : 'Notification'}
          </Text>
          {item.body.length > 0 ? (
            <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <Text style={[styles.rowMeta, { fontFamily: fontFamilies.regular }]}>
            {formatWhen(item)}
          </Text>
        </View>
        <MaterialIcon name="chevron_right" size={20} color={colors.text.subdued} />
      </Pressable>
    ),
    [
      colors.accent,
      colors.borderSubtle,
      colors.surface,
      colors.text.subdued,
      fontFamilies.medium,
      fontFamilies.regular,
      fontFamilies.semibold,
      navigation,
      styles,
    ],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>Notifications</Text>
        <Pressable
          style={styles.remindersLink}
          onPress={() => navigation.navigate('ReminderList')}
          accessibilityRole="button"
          accessibilityLabel="Open your reminders"
        >
          <MaterialIcon name="schedule" size={18} color={colors.accent} />
          <Text style={[styles.remindersLinkText, { fontFamily: fontFamilies.semibold }]}>
            Your reminders
          </Text>
        </Pressable>
      </View>
    ),
    [
      colors.accent,
      fontFamilies.bold,
      fontFamilies.semibold,
      navigation,
      styles.header,
      styles.remindersLink,
      styles.remindersLinkText,
      styles.title,
    ],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <FlatList
        style={styles.list}
        data={visible}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          refreshing ? (
            <View style={[styles.empty, { backgroundColor: colors.surface }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.surface }]}>
              <MaterialIcon name="notifications" size={40} color={colors.text.subdued} />
              <Text style={[styles.emptyTitle, { fontFamily: fontFamilies.bold }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptyBody, { fontFamily: fontFamilies.medium }]}>
                Alerts show up here after they are delivered or shown in the app — not every
                scheduled future reminder.
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: tabBarInset + spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </SafeAreaView>
  );
};
