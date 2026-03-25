import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import type { AuthStackParamList } from '../../../../app/navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { OtpTopBar } from '../components/otp/OtpTopBar';
import { OtpBrandBadge } from '../components/otp/OtpBrandBadge';
import { OtpDigitRow } from '../components/otp/OtpDigitRow';
import { OTP_COLORS, otpScreenStyles as styles } from './OtpScreen.styles';
import { Button } from '../../../../shared/components/Button';
import { AppText } from '../../../../shared/components/AppText';
import { MaterialIcon } from '../../../../shared/components/MaterialIcon';

type OtpNavigation = NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
type OtpRoute = RouteProp<AuthStackParamList, 'Otp'>;

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation<OtpNavigation>();
  const route = useRoute<OtpRoute>();
  const insets = useSafeAreaInsets();
  const { fontFamilies } = useTheme();
  const verifyOtp = useAuthStore(state => state.verifyOtp);
  const resendOtp = useAuthStore(state => state.resendOtp);
  const authError = useAuthStore(state => state.authError);
  const clearAuthError = useAuthStore(state => state.clearAuthError);
  const loading = useAuthStore(state => state.loading);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [verificationId, setVerificationId] = useState(route.params.verificationId);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(30);
  const inputRef = useRef<TextInput>(null);

  const displayMobile = useMemo(() => {
    if (route.params.displayPhone) {
      return route.params.displayPhone;
    }
    const m = route.params.mobile;
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 10) {
      const local = digits.slice(-10);
      return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 10)}`;
    }
    return m;
  }, [route.params.displayPhone, route.params.mobile]);

  React.useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }
    const timerId = setTimeout(() => {
      setResendSecondsLeft(current => Math.max(0, current - 1));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [resendSecondsLeft]);

  const handleVerify = async () => {
    const code = otp.replace(/\D/g, '');
    setError(null);
    clearAuthError();
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    const ok = await verifyOtp(verificationId, code);
    if (!ok && !useAuthStore.getState().isAuthenticated) {
      setError('OTP verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (resendSecondsLeft > 0 || loading) {
      return;
    }
    clearAuthError();
    setError(null);
    const phoneE164 = `+${route.params.mobile}`;
    const nextVerificationId = await resendOtp(phoneE164);
    if (!nextVerificationId) {
      setError('Unable to resend OTP right now. Please try again.');
      return;
    }
    setVerificationId(nextVerificationId);
    setOtp('');
    setResendSecondsLeft(30);
  };

  const topBarHeight = 56 + insets.top;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundDecorContainer} pointerEvents="none">
        <View style={styles.decorTopRight} />
        <View style={styles.decorBottomLeft} />
      </View>

      <View style={[styles.topBar, { height: topBarHeight, paddingTop: insets.top }]}>
        <OtpTopBar onBack={() => navigation.goBack()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: topBarHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.titleBlock}>
          <OtpBrandBadge />
          <AppText style={[styles.title, { fontFamily: fontFamilies.extrabold }]}>
            Verification
          </AppText>
          <AppText style={[styles.subtitle, { fontFamily: fontFamilies.medium }]}>
            We&apos;ve sent a 6-digit code to your mobile number{' '}
            <AppText style={[styles.subtitleBold, { fontFamily: fontFamilies.bold }]}>
              {displayMobile}
            </AppText>
          </AppText>
        </View>

        <View style={styles.form}>
          <OtpDigitRow
            otp={otp}
            isFocused={isOtpFocused}
            onPress={() => inputRef.current?.focus()}
            fontFamilyBold={fontFamilies.bold}
          />

          <TextInput
            ref={inputRef}
            value={otp}
            onFocus={() => setIsOtpFocused(true)}
            onBlur={() => setIsOtpFocused(false)}
            onChangeText={text => setOtp(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
          />

          {error ? (
            <AppText style={[styles.errorText, { fontFamily: fontFamilies.regular }]}>
              {error}
            </AppText>
          ) : null}
          {!error && authError ? (
            <AppText style={[styles.errorText, { fontFamily: fontFamilies.regular }]}>
              {authError}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={loading ? 'Verifying...' : 'Verify & Proceed  ›'}
              onPress={handleVerify}
              disabled={loading}
              style={[
                styles.primaryButton,
                loading ? styles.primaryButtonDisabled : undefined,
              ]}
              textStyle={[
                styles.primaryButtonText,
                { fontFamily: fontFamilies.bold },
              ]}
            />

            <View style={styles.resendBlock}>
              <AppText
                style={[styles.resendCaption, { fontFamily: fontFamilies.medium }]}
              >
                Didn&apos;t receive the code?
              </AppText>
              <Pressable style={styles.resendButton} onPress={handleResend}>
                <View style={styles.resendClock}>
                  <MaterialIcon
                    name="schedule"
                    size={16}
                    color={OTP_COLORS.primary}
                  />
                </View>
                <AppText
                  style={[styles.resendLinkText, { fontFamily: fontFamilies.bold }]}
                >
                  {resendSecondsLeft > 0
                    ? `Resend in 0:${String(resendSecondsLeft).padStart(2, '0')}`
                    : 'Resend code'}
                </AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.secureNote}>
            <AppText style={[styles.secureNoteIcon, { fontFamily: fontFamilies.bold }]}>
              🔒
            </AppText>
            <AppText
              style={[styles.secureNoteText, { fontFamily: fontFamilies.semibold }]}
            >
              SECURE ENCRYPTED CONNECTION
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OtpScreen;
