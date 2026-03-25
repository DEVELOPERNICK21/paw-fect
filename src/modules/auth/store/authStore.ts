import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { authComposition } from '../authComposition';
import type { User } from '../domain/models/User';
import { isAuthError } from '../domain/models/AuthError';
import type { UserProfileLabels } from '../domain/usecases/BuildUserProfileLabels';
import type { ValidateEmailAuthInputResult } from '../domain/usecases/ValidateEmailAuthInput';
import type { ValidatePhoneForLoginResult } from '../domain/usecases/ValidatePhoneForLogin';

const ac = authComposition;

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  sessionStatus: 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  validateEmailAuthInput: (
    emailRaw: string,
    password: string,
  ) => ValidateEmailAuthInputResult;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  requestOtp: (phoneE164: string) => Promise<string | null>;
  verifyOtp: (verificationId: string, otpCode: string) => Promise<boolean>;
  resendOtp: (phoneE164: string) => Promise<string | null>;
  sendPasswordResetEmail: (emailRaw: string) => Promise<void>;
  processPasswordResetQueue: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
  clearAuthNotice: () => void;
  devLogin: () => void;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  validatePhoneForLogin: (
    countryCallingCodeDigits: string,
    nationalDigitsRaw: string,
  ) => ValidatePhoneForLoginResult;
}

export const selectAuthProfileLabels = (state: AuthState): UserProfileLabels =>
  ac.buildUserProfileLabels.execute(state.user, state.sessionStatus);

let sessionUnsubscribe: (() => void) | null = null;
let logoutInFlight: Promise<void> | null = null;

export const ensureAuthSessionListenerAttached = (): void => {
  if (sessionUnsubscribe !== null) {
    return;
  }
  sessionUnsubscribe = ac.startAuthSessionListener.execute(user => {
    useAuthStore.setState({
      user,
      isAuthenticated: Boolean(user),
      isSessionReady: true,
      sessionStatus: user ? 'authenticated' : 'unauthenticated',
      loading: false,
    });
  });
};

const logUnexpectedAuthError = (scope: string, error: unknown): void => {
  if (!__DEV__) {
    return;
  }
  if (isAuthError(error)) {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(scope, error);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isSessionReady: false,
  sessionStatus: 'idle',
  loading: false,
  authError: null,
  authNotice: null,
  validateEmailAuthInput: (emailRaw, password) =>
    ac.validateEmailAuthInput.execute(emailRaw, password),

  login: async (email: string, password: string) => {
    set({ loading: true, authError: null, authNotice: null, sessionStatus: 'idle' });
    try {
      const user = await ac.executeAuthWithRetry.execute(() =>
        ac.login.execute(email, password),
      );
      set({
        user,
        isAuthenticated: true,
        loading: false,
        authError: null,
        isSessionReady: true,
        sessionStatus: 'authenticated',
      });
    } catch (error) {
      logUnexpectedAuthError('[authStore] login error', error);
      set({
        loading: false,
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Unable to login. Please try again.',
        ),
        sessionStatus: 'unauthenticated',
        isSessionReady: true,
      });
    }
  },

  signup: async (email: string, password: string) => {
    set({ loading: true, authError: null, authNotice: null, sessionStatus: 'idle' });
    try {
      const user = await ac.executeAuthWithRetry.execute(() =>
        ac.signup.execute(email, password),
      );
      set({
        user,
        isAuthenticated: true,
        loading: false,
        authError: null,
        isSessionReady: true,
        sessionStatus: 'authenticated',
      });
    } catch (error) {
      logUnexpectedAuthError('[authStore] signup error', error);
      set({
        loading: false,
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Unable to signup. Please try again.',
        ),
        sessionStatus: 'unauthenticated',
        isSessionReady: true,
      });
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, authError: null, authNotice: null, sessionStatus: 'idle' });
    try {
      const user = await ac.executeAuthWithRetry.execute(() =>
        ac.loginWithGoogle.execute(),
      );
      set({
        user,
        isAuthenticated: true,
        loading: false,
        authError: null,
        isSessionReady: true,
        sessionStatus: 'authenticated',
      });
      return true;
    } catch (error) {
      logUnexpectedAuthError('[authStore] loginWithGoogle error', error);
      const message = ac.resolveAuthErrorMessage.execute(
        error,
        'Google Sign-In is unavailable right now. Please use email login.',
      );
      set({
        loading: false,
        authError: message,
        sessionStatus: 'unauthenticated',
        isSessionReady: true,
      });
      return false;
    }
  },

  requestOtp: async (phoneE164: string) => {
    set({ loading: true, authError: null });
    try {
      const verificationId = await ac.executeAuthWithRetry.execute(() =>
        ac.requestOtp.execute(phoneE164),
      );
      set({ loading: false, authError: null });
      return verificationId;
    } catch (error) {
      logUnexpectedAuthError('[authStore] requestOtp error', error);
      set({
        loading: false,
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Could not send OTP. Please retry.',
        ),
      });
      return null;
    }
  },

  verifyOtp: async (verificationId: string, otpCode: string) => {
    set({ loading: true, authError: null });
    try {
      const user = await ac.verifyOtp.execute(verificationId, otpCode);
      set({
        user,
        isAuthenticated: true,
        loading: false,
        authError: null,
        isSessionReady: true,
        sessionStatus: 'authenticated',
      });
      return true;
    } catch (error) {
      logUnexpectedAuthError('[authStore] verifyOtp error', error);
      set({
        loading: false,
        isAuthenticated: false,
        isSessionReady: true,
        sessionStatus: 'unauthenticated',
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Invalid or expired OTP. Please try again.',
        ),
      });
      return false;
    }
  },

  resendOtp: async (phoneE164: string) => {
    set({ loading: true, authError: null });
    try {
      const verificationId = await ac.executeAuthWithRetry.execute(() =>
        ac.resendOtp.execute(phoneE164),
      );
      set({ loading: false, authError: null });
      return verificationId;
    } catch (error) {
      logUnexpectedAuthError('[authStore] resendOtp error', error);
      set({
        loading: false,
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Could not resend OTP. Try again soon.',
        ),
      });
      return null;
    }
  },

  sendPasswordResetEmail: async (emailRaw: string) => {
    set({ authError: null, authNotice: null });
    const validated = ac.validateEmailForReset.execute(emailRaw);
    if (!validated.ok) {
      set({ authError: validated.errorMessage });
      return;
    }
    set({ loading: true });
    try {
      await ac.executeAuthWithRetry.execute(() =>
        ac.sendPasswordResetEmail.execute(validated.normalizedEmail),
      );
      set({
        loading: false,
        authNotice:
          'If an account exists for that email, you will receive reset instructions shortly.',
        authError: null,
      });
    } catch (error) {
      logUnexpectedAuthError('[authStore] sendPasswordResetEmail error', error);
      set({
        loading: false,
        authError: ac.resolveAuthErrorMessage.execute(
          error,
          'Could not send reset email. Try again.',
        ),
      });
    }
  },

  processPasswordResetQueue: async () => {
    // Best-effort background flush. This should not affect current UI state.
    try {
      await ac.processPasswordResetQueue.execute();
    } catch (error) {
      logUnexpectedAuthError(
        '[authStore] processPasswordResetQueue error',
        error,
      );
    }
  },

  refreshProfile: async () => {
    if (!get().isAuthenticated) {
      return;
    }
    try {
      const user = await ac.refreshAuthProfile.execute();
      if (user) {
        set({ user });
      }
    } catch (error) {
      logUnexpectedAuthError('[authStore] refreshProfile error', error);
    }
  },

  clearAuthError: () => set({ authError: null }),

  clearAuthNotice: () => set({ authNotice: null }),

  devLogin: () => {
    if (!__DEV__) {
      return;
    }

    const now = new Date().toISOString();
    const mockUser: User = {
      id: 'dev-user',
      email: 'dev@pawfect.local',
      displayName: 'Dev User',
      photoURL: null,
      phoneNumber: null,
      createdAt: now,
      lastLoginAt: now,
      onboardingCompleted: false,
    };

    set({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      authError: null,
      isSessionReady: true,
      sessionStatus: 'authenticated',
    });
  },

  logout: async () => {
    if (logoutInFlight) {
      return logoutInFlight;
    }
    logoutInFlight = (async () => {
      set({ loading: true, authError: null });
      try {
        await ac.logout.execute();
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          authError: null,
          authNotice: null,
          isSessionReady: true,
          sessionStatus: 'unauthenticated',
        });
      } catch (error) {
        logUnexpectedAuthError('[authStore] logout error', error);
        set({ loading: false, authError: 'Failed to logout. Please retry.' });
      } finally {
        logoutInFlight = null;
      }
    })();
    return logoutInFlight;
  },

  loadCurrentUser: async () => {
    set({ loading: true, authError: null, sessionStatus: 'restoring' });
    try {
      const user = await ac.getCurrentUser.execute();
      set({
        user,
        isAuthenticated: Boolean(user),
        loading: false,
        authError: null,
        isSessionReady: true,
        sessionStatus: user ? 'authenticated' : 'unauthenticated',
      });
    } catch (error) {
      logUnexpectedAuthError('[authStore] loadCurrentUser error', error);
      set({
        loading: false,
        authError: 'Failed to restore session.',
        isSessionReady: true,
        sessionStatus: 'unauthenticated',
      });
    }
  },

  validatePhoneForLogin: (countryCallingCodeDigits, nationalDigitsRaw) =>
    ac.validatePhoneForLogin.execute(
      countryCallingCodeDigits,
      nationalDigitsRaw,
    ),
}));

export const useAuthProfileLabels = (): UserProfileLabels =>
  useAuthStore(useShallow(selectAuthProfileLabels));
