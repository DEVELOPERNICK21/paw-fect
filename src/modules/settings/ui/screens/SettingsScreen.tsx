import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTabBarInset } from '../../../../app/navigation/layout';
import type { SettingsRootNavigation } from '../../../../app/navigation/types';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';
import { UserAvatar } from '../../../../shared/components/UserAvatar';
import { icons } from '../../../../shared/assets/icons';
import { APP_VERSION_LABEL } from '../../../../shared/constants/appMeta';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { spacing } from '../../../../shared/theme/spacing';
import { radius } from '../../../../shared/theme/radius';
import { fontSizes, lineHeights } from '../../../../shared/theme/typography';
import {
  useAuthProfileLabels,
  useAuthStore,
} from '../../../auth/store/authStore';
import type { Pet } from '../../../pets/domain/models/Pet';
import { usePetStore } from '../../../pets/store/petStore';
import { useSettingsStore } from '../../store/settingsStore';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsRootNavigation>();
  const tabBarInset = useAppTabBarInset();
  const { fontFamilies, colors, isDarkMode, selectedThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, tabBarInset), [colors, tabBarInset]);
  const { settings, loadSettings, updateSettings, setThemeMode } = useSettingsStore();
  const { logout, loading } = useAuthStore();
  const pets = usePetStore(s => s.pets);
  const loadPets = usePetStore(s => s.loadPets);
  const deletePet = usePetStore(s => s.deletePet);
  const profileLabels = useAuthProfileLabels();
  const avatarSize = spacing['4xl'] * 2;
  const [deletePickerVisible, setDeletePickerVisible] = useState(false);

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  const toggleNotifications = () => {
    if (!settings) {
      return;
    }
    updateSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled }).catch(() => {});
  };

  const toggleEmail = () => {
    if (!settings) {
      return;
    }
    updateSettings({ ...settings, emailUpdates: !settings.emailUpdates }).catch(() => {});
  };

  const toggleTheme = (nextValue: boolean) => {
    setThemeMode(nextValue ? 'dark' : 'light').catch(() => {});
  };

  const themeDescription =
    selectedThemeMode === 'system'
      ? 'Using system setting'
      : isDarkMode
        ? 'Dark theme enabled'
        : 'Light theme enabled';

  const handleLogout = () => {
    logout().catch(() => {});
  };

  const confirmDeletePetFromSettings = useCallback(
    (pet: Pet) => {
      Alert.alert(
        'Delete pet?',
        `Permanently remove ${pet.name}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                const result = await deletePet(pet.id);
                if (!result.success) {
                  Alert.alert('Could not delete', result.error ?? 'Try again.');
                  return;
                }
                setDeletePickerVisible(false);
              })();
            },
          },
        ],
      );
    },
    [deletePet],
  );

  const handleDeletePetProfilePress = () => {
    void (async () => {
      await loadPets();
      const list = usePetStore.getState().pets;
      if (list.length === 0) {
        Alert.alert('No pets', 'You do not have any pet profiles to delete yet.');
        return;
      }
      if (list.length === 1) {
        confirmDeletePetFromSettings(list[0]!);
        return;
      }
      setDeletePickerVisible(true);
    })();
  };

  const goBackFromTabRoot = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('HomeTab', { screen: 'Home' });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={goBackFromTabRoot}>
          <MaterialIcon name="arrow_back" size={20} color={colors.text.heading} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontFamilies.bold }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileWrap}>
            <UserAvatar
              photoUri={profileLabels.photoUri}
              initials={profileLabels.initials}
              size={avatarSize}
              loading={profileLabels.isProfileLoading}
            />
            <Pressable style={styles.editProfileBadge} accessibilityRole="button">
              <icons.editPencil width={14} height={14} />
            </Pressable>
          </View>
          <Text style={[styles.profileName, { fontFamily: fontFamilies.bold }]}>
            {profileLabels.primaryDisplayName}
          </Text>
          {profileLabels.maskedEmail ? (
            <Text style={[styles.profileMeta, { fontFamily: fontFamilies.medium }]}>
              {profileLabels.maskedEmail}
            </Text>
          ) : null}
          {profileLabels.memberSinceLine ? (
            <Text style={[styles.profileMeta, styles.profileMetaSecondary, { fontFamily: fontFamilies.medium }]}>
              {profileLabels.memberSinceLine}
            </Text>
          ) : null}
        </View>

        <View style={styles.group}>
          <Text style={[styles.groupTitle, { fontFamily: fontFamilies.bold }]}>NOTIFICATIONS</Text>
          <View style={styles.groupCard}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcon name="notifications" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { fontFamily: fontFamilies.semibold }]}>Push Notifications</Text>
                  <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]}>Activity and care reminders</Text>
                </View>
              </View>
              <Switch
                value={settings?.notificationsEnabled ?? true}
                onValueChange={toggleNotifications}
                thumbColor={colors.surface}
                trackColor={{ true: colors.primary, false: colors.borderSubtle }}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcon name="mail" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { fontFamily: fontFamilies.semibold }]}>Email Updates</Text>
                  <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]}>Weekly health reports & news</Text>
                </View>
              </View>
              <Switch
                value={settings?.emailUpdates ?? false}
                onValueChange={toggleEmail}
                thumbColor={colors.surface}
                trackColor={{ true: colors.primary, false: colors.borderSubtle }}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcon name="dark_mode" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { fontFamily: fontFamilies.semibold }]}>Dark Theme</Text>
                  <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]}>{themeDescription}</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                thumbColor={colors.surface}
                trackColor={{ true: colors.primary, false: colors.borderSubtle }}
              />
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.groupTitle, { fontFamily: fontFamilies.bold }]}>ACCOUNT & PETS</Text>
          <View style={styles.groupCard}>
            <Pressable style={styles.actionRow} onPress={handleDeletePetProfilePress}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, styles.dangerIcon]}>
                  <MaterialIcon name="delete_forever" size={20} color={colors.danger} />
                </View>
                <View>
                  <Text style={[styles.actionTitleDanger, { fontFamily: fontFamilies.semibold }]}>Delete Pet Profile</Text>
                  <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]}>Permanently remove a pet</Text>
                </View>
              </View>
              <MaterialIcon name="chevron_right" size={20} color={colors.text.subdued} />
            </Pressable>

            <Pressable style={styles.actionRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconNeutral}>
                  <MaterialIcon name="lock" size={20} color={colors.text.body} />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { fontFamily: fontFamilies.semibold }]}>Privacy Policy</Text>
                  <Text style={[styles.rowSubtitle, { fontFamily: fontFamilies.medium }]}>How we protect your data</Text>
                </View>
              </View>
              <MaterialIcon name="chevron_right" size={20} color={colors.text.subdued} />
            </Pressable>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout} disabled={loading}>
            <MaterialIcon name="logout" size={18} color={colors.dangerDark} />
            <Text style={[styles.logoutText, { fontFamily: fontFamilies.bold }]}>Logout</Text>
          </Pressable>
          <Text style={[styles.versionText, { fontFamily: fontFamilies.regular }]}>
            Pawfect • {APP_VERSION_LABEL} • Made with love for pets
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={deletePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletePickerVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          >
            <Text style={[styles.modalTitle, { fontFamily: fontFamilies.bold, color: colors.text.heading }]}>
              Choose a pet to delete
            </Text>
            <Text style={[styles.modalHint, { fontFamily: fontFamilies.medium, color: colors.text.body }]}>
              This removes the pet from Pawfect. This cannot be undone.
            </Text>
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {pets.map(pet => (
                <Pressable
                  key={pet.id}
                  style={[styles.modalRow, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceAlt }]}
                  onPress={() => {
                    setDeletePickerVisible(false);
                    confirmDeletePetFromSettings(pet);
                  }}
                >
                  <icons.paw width={20} height={20} />
                  <Text
                    style={[styles.modalRowLabel, { fontFamily: fontFamilies.semibold, color: colors.text.heading }]}
                  >
                    {pet.name}
                  </Text>
                  <MaterialIcon name="chevron_right" size={20} color={colors.text.subdued} />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={[styles.modalCancel, { borderColor: colors.borderSubtle }]}
              onPress={() => setDeletePickerVisible(false)}
            >
              <Text style={[styles.modalCancelText, { fontFamily: fontFamilies.semibold, color: colors.text.heading }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  tabBarInset: number,
) =>
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
  content: {
    paddingBottom: spacing['4xl'] + spacing['3xl'] + spacing.md + tabBarInset,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  profileWrap: {
    width: spacing['4xl'] * 2,
    height: spacing['4xl'] * 2,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  profileImage: { width: '100%', height: '100%', borderRadius: radius.round },
  editProfileBadge: {
    position: 'absolute',
    right: -spacing.xxs,
    bottom: -spacing.xxs,
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    marginTop: spacing.lg,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.lg,
    color: colors.text.heading,
  },
  profileMeta: {
    marginTop: spacing.xxs,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text.body,
  },
  profileMetaSecondary: {
    color: colors.text.subdued,
  },
  group: { marginTop: spacing.lg + spacing.xxs, paddingHorizontal: spacing.lg },
  groupTitle: {
    marginLeft: spacing.sm,
    marginBottom: spacing.sm + spacing.xxs,
    fontSize: fontSizes.xs - 1,
    lineHeight: lineHeights.sm - spacing.xxs,
    letterSpacing: 1.2,
    color: colors.text.subdued,
  },
  groupCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + spacing.xxs,
    gap: spacing.xxs,
  },
  row: {
    minHeight: spacing['4xl'] + spacing.xl - spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.md,
  },
  rowIcon: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconNeutral: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: { backgroundColor: colors.surfaceAlt },
  rowTitle: {
    color: colors.text.heading,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.md + spacing.xs - spacing.xxs,
  },
  actionTitleDanger: {
    color: colors.danger,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.md + spacing.xs - spacing.xxs,
  },
  rowSubtitle: {
    marginTop: spacing.xxs,
    color: colors.text.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  actionRow: {
    minHeight: spacing['4xl'] + spacing.xl - spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  logoutSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    height: spacing['4xl'] + spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.dangerDark,
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
  },
  versionText: {
    marginTop: spacing.lg + spacing.xs,
    marginBottom: spacing.sm + spacing.xxs,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.text.subdued,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: '72%',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    marginBottom: spacing.sm,
  },
  modalHint: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.md,
  },
  modalList: { maxHeight: 280 },
  modalListContent: { gap: spacing.sm, paddingBottom: spacing.xs },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  modalRowLabel: { flex: 1, fontSize: fontSizes.base },
  modalCancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: fontSizes.base },
});

export default SettingsScreen;
