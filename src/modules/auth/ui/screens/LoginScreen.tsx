import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../../../shared/hooks/useTheme';
import type { Theme } from '../../../../shared/hooks/useTheme';
import { images } from '../../../../shared/assets/images';
import { icons } from '../../../../shared/assets/icons';
import { Input } from '../../../../shared/components/Input';
import { Button } from '../../../../shared/components/Button';
import { AppText } from '../../../../shared/components/AppText';

type LoginStylesParams = Pick<
  Theme,
  'colors' | 'space' | 'radius' | 'spacing' | 'textStyles'
>;

const LOGO_SCALE_MIN = 1;
const LOGO_SCALE_MAX = 1.06;
const LOGO_PULSE_MS = 2200;

export const LoginScreen: React.FC = () => {
  const login = useAuthStore(state => state.login);
  const signup = useAuthStore(state => state.signup);
  const validateEmailAuthInput = useAuthStore(
    state => state.validateEmailAuthInput,
  );
  const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
  const loading = useAuthStore(state => state.loading);
  const authError = useAuthStore(state => state.authError);
  const clearAuthError = useAuthStore(state => state.clearAuthError);
  const clearAuthNotice = useAuthStore(state => state.clearAuthNotice);
  const sendPasswordResetEmail = useAuthStore(
    state => state.sendPasswordResetEmail,
  );
  const authNotice = useAuthStore(state => state.authNotice);
  const posthog = usePostHog();
  const { colors, space, radius, spacing, textStyles } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, space, radius, spacing, textStyles }),
    [colors, space, radius, spacing, textStyles],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoScale = useRef(new Animated.Value(LOGO_SCALE_MIN)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: LOGO_SCALE_MAX,
          duration: LOGO_PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: LOGO_SCALE_MIN,
          duration: LOGO_PULSE_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [logoScale]);

  const handleEmailAuthPress = async () => {
    setError(null);
    clearAuthError();

    const validationResult = validateEmailAuthInput(email, password);
    if (!validationResult.ok) {
      setError(validationResult.errorMessage);
      return;
    }

    if (isCreateMode) {
      await signup(validationResult.normalizedEmail, password);
      if (!useAuthStore.getState().authError) {
        posthog.capture('user_signed_up', { method: 'email' });
      }
      return;
    }

    await login(validationResult.normalizedEmail, password);
    if (!useAuthStore.getState().authError) {
      posthog.capture('user_logged_in', { method: 'email' });
    }
  };

  const handleGoogleLoginPress = async () => {
    setError(null);
    clearAuthError();
    const success = await loginWithGoogle();
    if (success) {
      posthog.capture('user_logged_in', { method: 'google' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical={false}
        scrollEnabled
      >
        <View style={styles.mainContent}>
          <View style={styles.brandSection}>
            <Animated.View
              style={[
                styles.brandIconTile,
                { transform: [{ scale: logoScale }] },
              ]}
            >
              <Image source={images.appIcon} style={styles.brandIcon} />
            </Animated.View>
            <AppText style={styles.brandTitle}>Pawsoul</AppText>
            <AppText style={styles.brandSubtitle}>
              Premium care for your beloved companions.
            </AppText>
          </View>

          <View style={styles.formSection}>
            <AppText style={styles.label}>Email</AppText>
            <Input
              containerStyle={styles.fieldSpacing}
              fieldStyle={error ? styles.fieldInputError : undefined}
              inputStyle={styles.inputText}
              placeholder="you@example.com"
              placeholderTextColor={colors.input.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={text => {
                setError(null);
                clearAuthNotice();
                setEmail(text);
              }}
            />

            <AppText style={styles.label}>Password</AppText>
            <Input
              containerStyle={styles.fieldSpacing}
              fieldStyle={error ? styles.fieldInputError : undefined}
              inputStyle={styles.inputText}
              placeholder="Enter password"
              placeholderTextColor={colors.input.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={text => {
                setError(null);
                setPassword(text);
              }}
            />
            {error ? (
              <AppText
                style={styles.fieldError}
                accessibilityLiveRegion="polite"
              >
                {error}
              </AppText>
            ) : null}
            {!error && authError ? (
              <AppText
                style={styles.fieldError}
                accessibilityLiveRegion="polite"
              >
                {authError}
              </AppText>
            ) : null}
            {authNotice ? (
              <AppText
                style={styles.fieldNotice}
                accessibilityLiveRegion="polite"
              >
                {authNotice}
              </AppText>
            ) : null}
            {!isCreateMode ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                disabled={loading}
                onPress={() => {
                  setError(null);
                  clearAuthError();
                  clearAuthNotice();
                  void sendPasswordResetEmail(email);
                }}
                style={styles.forgotPasswordWrap}
              >
                <AppText style={styles.forgotPasswordText}>
                  Forgot password?
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button
              title={
                loading
                  ? isCreateMode
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isCreateMode
                  ? 'Create account with Email'
                  : 'Sign in with Email'
              }
              onPress={handleEmailAuthPress}
              disabled={loading}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
            <Button
              title="Continue with Google"
              onPress={handleGoogleLoginPress}
              disabled={loading}
              variant="secondary"
              style={styles.googleButton}
              textStyle={styles.googleButtonText}
              leftAccessory={
                <icons.google width={space('2xl')} height={space('2xl')} />
              }
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isCreateMode ? 'Switch to login' : 'Switch to register'
              }
              disabled={loading}
              onPress={() => {
                setError(null);
                clearAuthError();
                clearAuthNotice();
                setIsCreateMode(current => !current);
              }}
              style={({ pressed }) => [
                styles.toggleLinkWrap,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <AppText
                style={[
                  styles.toggleLinkText,
                  loading ? { opacity: 0.6 } : null,
                ]}
              >
                {isCreateMode
                  ? 'Already have an account? Log in'
                  : "Don't have an account? Register"}
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            By continuing, you agree to our{'\n '}
            <AppText style={styles.footerLink}>
              Terms of Service
            </AppText> and{' '}
            <AppText style={styles.footerLink}>Privacy Policy</AppText>.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({
  colors,
  space,
  radius,
  spacing,
  textStyles: ts,
}: LoginStylesParams) => {
  const brandGlowShadow = {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: space('sm') + space('xs') },
    shadowOpacity: 0.12,
    shadowRadius: space('md') + space('xs'),
    elevation: 10,
  } as const;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
    },
    content: {
      flexGrow: 1,
      paddingTop: spacing.xl + spacing.xs,
      paddingBottom: spacing.lg + spacing.xxs,
      alignItems: 'center',
      paddingHorizontal: space('xl'),
      justifyContent: 'space-between',
    },
    mainContent: {
      width: '100%',
      marginTop: spacing.lg,
    },
    brandSection: {
      marginTop: space('xxs'),
      width: '100%',
      alignItems: 'center',
      marginBottom: spacing['2xl'] + spacing.xxs,
    },
    brandIconTile: {
      width: 150,
      height: 150,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space('md') + space('xs'),
      borderRadius: radius.round,
      ...brandGlowShadow,
    },
    brandIcon: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    brandTitle: {
      ...ts.display,
      color: colors.text.heading,
      textAlign: 'center',
    },
    brandSubtitle: {
      ...ts.marketingLead,
      marginTop: space('xxs'),
      color: colors.text.body,
      textAlign: 'center',
    },
    formSection: {
      width: '100%',
      marginBottom: spacing.lg,
    },
    label: {
      ...ts.fieldLabel,
      color: colors.text.body,
      marginLeft: space('xxs'),
      marginBottom: space('sm') + space('xxs'),
    },
    fieldSpacing: {
      marginBottom: space('md'),
    },
    fieldInputError: {
      borderColor: colors.danger,
    },
    fieldError: {
      ...ts.caption,
      color: colors.danger,
      marginTop: space('xs'),
    },
    fieldNotice: {
      ...ts.caption,
      color: colors.success,
      marginTop: space('xs'),
    },
    forgotPasswordWrap: {
      alignSelf: 'flex-end',
      marginTop: space('sm'),
      marginBottom: space('xs'),
    },
    forgotPasswordText: {
      ...ts.footerLink,
      color: colors.accent,
    },
    inputText: {
      ...ts.inputLarge,
      color: colors.text.heading,
    },
    actions: {
      width: '100%',
      marginBottom: spacing.xl + spacing.xxs,
    },
    primaryButton: {
      height: spacing['3xl'] + spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: space('sm') + space('sm') },
      shadowOpacity: 0.3,
      shadowRadius: spacing.md + spacing.xs,
      elevation: 8,
    },
    googleButton: {
      marginTop: space('lg'),
      height: spacing['3xl'] + spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: space('xs') },
      shadowOpacity: 0.12,
      shadowRadius: space('sm'),
      elevation: 2,
    },
    toggleButton: {
      marginTop: space('sm'),
      height: spacing['3xl'],
      borderRadius: radius.md,
      backgroundColor: colors.backgroundAlt,
      borderColor: colors.borderSubtle,
    },
    toggleButtonText: {
      ...ts.control,
      color: colors.text.secondary,
    },
    toggleLinkWrap: {
      marginTop: space('sm'),
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space('xxs'),
    },
    toggleLinkText: {
      ...ts.footerLink,
      color: colors.accent,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    googleButtonText: {
      ...ts.title,
      color: colors.text.heading,
    },
    primaryButtonText: {
      ...ts.title,
      color: colors.text.inverse,
    },
    footer: {
      alignItems: 'center',
      paddingTop: spacing['3xl'] + spacing.xs,
      paddingBottom: space('xs'),
      width: '100%',
    },
    footerText: {
      ...ts.footer,
      color: colors.text.subdued,
      textAlign: 'center',
    },
    footerLink: {
      ...ts.footerLink,
      color: colors.accent,
    },
  });
};

export default LoginScreen;
