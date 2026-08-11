import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type {
  AppTabParamList,
  NotificationsStackParamList,
} from '../../../../app/navigation/types';
import { notificationService } from '../../../../infrastructure/notifications/notificationService';
import { getNotificationNavigationTarget } from '../../../../infrastructure/notifications/getNotificationNavigationTarget';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { useTheme, type Theme } from '../../../../shared/hooks/useTheme';

import { useNotificationFeedStore } from '../../store/notificationFeedStore';

type DetailNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<NotificationsStackParamList, 'NotificationDetail'>,
  BottomTabNavigationProp<AppTabParamList>
>;

const createStyles = ({ colors, spacing, radius }: Pick<Theme, 'colors' | 'spacing' | 'radius'>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.backgroundAlt },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 18,
      lineHeight: 24,
      color: colors.text.heading,
    },
    body: { paddingHorizontal: spacing.lg, gap: spacing.md },
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    label: { fontSize: 12, lineHeight: 16, color: colors.text.subdued },
    value: { fontSize: 15, lineHeight: 22, color: colors.text.body },
    primaryBtn: {
      marginTop: spacing.sm,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: { fontSize: 16, color: colors.text.inverse },
    secondaryBtn: {
      marginTop: spacing.sm,
      height: 48,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: { fontSize: 15 },
  });

function hasRelatedAction(data: Record<string, string>): boolean {
  return getNotificationNavigationTarget(data) != null;
}

function openRelated(navigation: DetailNavigation, data: Record<string, string>): void {
  const target = getNotificationNavigationTarget(data);
  if (target == null) {
    return;
  }
  const tab = navigation.getParent();
  switch (target.target) {
    case 'reminderDetail':
      navigation.navigate('ReminderDetail', { reminderId: target.reminderId });
      return;
    case 'healthRecords':
      tab?.navigate('HealthTab', {
        screen: 'HealthRecords',
        params: { focusRecordId: target.focusRecordId },
      });
      return;
    case 'wellnessHub':
      tab?.navigate('NotificationsTab', {
        screen: 'WellnessHub',
        params: {
          petId: target.petId,
          blockId: target.blockId,
        },
      });
      return;
    case 'petProfile':
      tab?.navigate('PetsTab', { screen: 'PetProfile' });
      return;
    case 'home':
      tab?.navigate('HomeTab', { screen: 'Home' });
  }
}

function relatedLabel(data: Record<string, string>): string {
  const target = getNotificationNavigationTarget(data);
  if (target == null) {
    return 'Open';
  }
  switch (target.target) {
    case 'reminderDetail':
      return 'Open reminder';
    case 'healthRecords':
      return 'Open health records';
    case 'wellnessHub':
      return 'Open wellness hub';
    case 'petProfile':
      return 'Open pet profile';
    case 'home':
      return 'Go to home';
  }
}

export const NotificationDetailScreen: React.FC = () => {
  const navigation = useNavigation<DetailNavigation>();
  const route = useRoute();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors, spacing, radius } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const notificationId = (route.params as { notificationId: string }).notificationId;
  const item = useNotificationFeedStore(
    s => s.itemsById[notificationId] ?? null,
  );
  const markRead = useNotificationFeedStore(s => s.markRead);
  const dismiss = useNotificationFeedStore(s => s.dismiss);

  useEffect(() => {
    markRead(notificationId);
  }, [markRead, notificationId]);

  const onDismiss = useCallback(async () => {
    dismiss(notificationId);
    await notificationService.cancelNotification(notificationId);
    navigation.goBack();
  }, [dismiss, navigation, notificationId]);

  const onOpenRelated = useCallback(() => {
    if (item?.data) {
      openRelated(navigation, item.data);
    }
  }, [item?.data, navigation]);

  if (item == null) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
          </Pressable>
          <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>Notification</Text>
        </View>
        <View style={[styles.body, { paddingTop: spacing.xl }]}>
          <Text style={[styles.value, { fontFamily: fontFamilies.medium }]}>
            This notification is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showRelated = hasRelatedAction(item.data);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcon name="arrow_back" size={22} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: fontFamilies.bold }]} numberOfLines={1}>
          {item.title.length > 0 ? item.title : 'Notification'}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarInset + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { borderColor: colors.borderSubtle, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.label, { fontFamily: fontFamilies.medium }]}>Message</Text>
          <Text style={[styles.value, { fontFamily: fontFamilies.regular }]}>{item.body}</Text>
          {item.deliveredAt != null ? (
            <>
              <Text style={[styles.label, { fontFamily: fontFamilies.medium }]}>Shown</Text>
              <Text style={[styles.value, { fontFamily: fontFamilies.regular }]}>
                {new Date(item.deliveredAt).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </Text>
            </>
          ) : null}
          {item.scheduledFor != null ? (
            <>
              <Text style={[styles.label, { fontFamily: fontFamilies.medium }]}>Scheduled for</Text>
              <Text style={[styles.value, { fontFamily: fontFamilies.regular }]}>
                {new Date(item.scheduledFor).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </Text>
            </>
          ) : null}
        </View>

        {showRelated ? (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={onOpenRelated}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: fontFamilies.bold }]}>
              {relatedLabel(item.data)}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.borderSubtle }]}
          onPress={onDismiss}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { fontFamily: fontFamilies.semibold, color: colors.text.secondary },
            ]}
          >
            Remove from list
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
