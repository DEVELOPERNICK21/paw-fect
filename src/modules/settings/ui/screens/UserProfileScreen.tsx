import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { SettingsRootNavigation } from '../../../../app/navigation/types';
import { AppText } from '../../../../shared/components/AppText';
import { FlatTabHeroBar } from '../../../../shared/components/FlatTabHeroBar';
import { Input } from '../../../../shared/components/Input';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';

const isValidPhone = (value: string): boolean =>
  value.length === 0 || /^[0-9+\-\s()]{8,20}$/.test(value);

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<SettingsRootNavigation>();
  const theme = useTheme();
  const { colors, textStyles, fontFamilies, space, radius } = theme;
  const user = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);
  const authError = useAuthStore(s => s.authError);
  const authNotice = useAuthStore(s => s.authNotice);
  const updateUserProfile = useAuthStore(s => s.updateUserProfile);
  const clearAuthError = useAuthStore(s => s.clearAuthError);
  const clearAuthNotice = useAuthStore(s => s.clearAuthNotice);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
        content: { paddingHorizontal: space('lg'), paddingBottom: space('2xl') },
        saveBtn: {
          marginTop: space('lg'),
          borderRadius: radius.pill,
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        },
      }),
    [colors, radius, space],
  );

  const handleSave = async (): Promise<void> => {
    setLocalError(null);
    clearAuthError();
    clearAuthNotice();

    const normalizedName = displayName.trim();
    const normalizedPhone = phoneNumber.trim();
    if (normalizedName.length < 2) {
      setLocalError('Name should be at least 2 characters.');
      return;
    }
    if (normalizedName.length > 40) {
      setLocalError('Name should be 40 characters or less.');
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setLocalError('Please enter a valid phone number.');
      return;
    }

    const ok = await updateUserProfile({
      displayName: normalizedName,
      phoneNumber: normalizedPhone.length > 0 ? normalizedPhone : null,
    });
    if (ok) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatTabHeroBar
        title="Profile"
        caption="Your account details"
        theme={theme}
        onPressBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.secondary, fontFamily: fontFamilies.medium },
          ]}
        >
          Name
        </AppText>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
          editable={!loading}
        />

        <View style={{ height: space('md') }} />
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.secondary, fontFamily: fontFamilies.medium },
          ]}
        >
          Phone Number (optional)
        </AppText>
        <Input
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+91 9876543210"
          keyboardType="phone-pad"
          editable={!loading}
        />

        <View style={{ height: space('md') }} />
        <AppText
          style={[
            textStyles.caption,
            { color: colors.text.subdued, fontFamily: fontFamilies.medium },
          ]}
        >
          Email: {user?.email ?? '-'}
        </AppText>

        {localError ? (
          <AppText style={[textStyles.caption, { color: colors.danger }]}>
            {localError}
          </AppText>
        ) : null}
        {authError ? (
          <AppText style={[textStyles.caption, { color: colors.danger }]}>
            {authError}
          </AppText>
        ) : null}
        {authNotice ? (
          <AppText style={[textStyles.caption, { color: colors.success }]}>
            {authNotice}
          </AppText>
        ) : null}

        <Pressable
          style={[styles.saveBtn, loading ? { opacity: 0.7 } : null]}
          disabled={loading}
          onPress={handleSave}
        >
          <AppText
            style={[
              textStyles.body,
              { color: colors.text.inverse, fontFamily: fontFamilies.bold },
            ]}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;
