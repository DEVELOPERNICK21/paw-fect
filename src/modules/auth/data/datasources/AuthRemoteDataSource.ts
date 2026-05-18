import type { User } from '../../domain/models/User';
import { AuthError } from '../../domain/models/AuthError';
import { apiClient } from '../../../../infrastructure/api/apiClient';
import { getApp } from '@react-native-firebase/app';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { getGoogleWebClientId } from '../../../../shared/constants/authConfig';

/** Shown when Android OAuth client / SHA-1 does not match (common for Play App Signing). */
const GOOGLE_ANDROID_SIGNING_SETUP_MESSAGE =
  'Google Sign-In failed: this build’s signing certificate is not registered in Firebase. ' +
  'For apps from the Play Store, open Play Console → Release → App integrity → App signing key certificate, ' +
  'copy SHA-1 and SHA-256, then Firebase Console → Project settings → Your apps → Android (app.pawfect) → Add fingerprint. ' +
  'Add your upload keystore SHA-1 too for testing release builds locally. Download google-services.json into android/app/ and rebuild.';

interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthRemoteDataSource {
  login(email: string, password: string): Promise<AuthResponse>;
  signup(email: string, password: string): Promise<AuthResponse>;
  loginWithGoogle(): Promise<AuthResponse>;
  requestOtp(phoneE164: string): Promise<{ verificationId: string }>;
  verifyOtp(
    verificationId: string,
    otpCode: string,
  ): Promise<AuthResponse>;
  resendOtp(phoneE164: string): Promise<{ verificationId: string }>;
  getCurrentSession(): Promise<AuthResponse | null>;
  getCurrentUser(token: string): Promise<User | null>;
  logout(token: string | null): Promise<void>;
  watchAuthChanges(
    onChange: (session: AuthResponse | null) => void,
  ): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  private readonly auth = getAuth(getApp());
  private googleConfigured = false;

  private mapFirebaseUser(
    firebaseUser: FirebaseAuthTypes.User,
    createdAtFallback?: string,
  ): User {
    const creationTime = firebaseUser.metadata.creationTime;
    const now = new Date().toISOString();
    return {
      id: firebaseUser.uid,
      email:
        firebaseUser.email ??
        `${firebaseUser.phoneNumber ?? firebaseUser.uid}@pawfect.app`,
      displayName: firebaseUser.displayName ?? null,
      photoURL: firebaseUser.photoURL ?? null,
      phoneNumber: firebaseUser.phoneNumber ?? null,
      createdAt: creationTime
        ? new Date(creationTime).toISOString()
        : createdAtFallback ?? now,
      lastLoginAt: now,
      onboardingCompleted: false,
    };
  }

  private toAuthError(error: unknown, fallbackMessage: string): AuthError {
    const rawCode = (error as { code?: string | number })?.code;
    const code = rawCode != null ? String(rawCode) : '';
    const message = (error as { message?: string })?.message ?? fallbackMessage;
    const loweredMessage = message.toLowerCase();

    if (code === statusCodes.SIGN_IN_CANCELLED || loweredMessage.includes('cancel')) {
      return new AuthError('cancelled', 'Sign-in cancelled.');
    }
    if (
      code === 'auth/network-request-failed' ||
      loweredMessage.includes('network') ||
      loweredMessage.includes('request failed')
    ) {
      return new AuthError('network', 'Network issue. Check internet and retry.');
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-email' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-login-credentials' ||
      code === 'auth/user-not-found'
    ) {
      return new AuthError('invalid_credentials', 'Invalid credentials.');
    }
    if (code === 'auth/email-already-in-use') {
      return new AuthError(
        'invalid_credentials',
        'Email is already registered. Please login instead.',
      );
    }
    if (code === 'auth/user-disabled') {
      return new AuthError(
        'account_disabled',
        'This account has been disabled. Contact support.',
      );
    }
    if (code === 'auth/too-many-requests') {
      return new AuthError(
        'rate_limited',
        'Too many attempts. Please wait and try again.',
      );
    }
    if (code === 'auth/requires-recent-login') {
      return new AuthError(
        'requires_recent_login',
        'Please sign in again to continue.',
      );
    }
    if (code === 'auth/billing-not-enabled') {
      return new AuthError(
        'configuration',
        'Phone auth billing is not enabled for this Firebase project.',
      );
    }
    if (
      loweredMessage.includes('not configured') ||
      loweredMessage.includes('play services')
    ) {
      return new AuthError('configuration', message);
    }
    // Android Google Sign-In: ApiException DEVELOPER_ERROR (10) — package / SHA-1 / OAuth client (Play App Signing SHA-1 is often missing)
    const looksLikeAndroidOAuthMismatch =
      code === '10' ||
      loweredMessage.includes('developer_error') ||
      loweredMessage.includes('de_pr') ||
      loweredMessage.includes('apiexception') && loweredMessage.includes(' 10') ||
      loweredMessage.includes('12501') ||
      loweredMessage.includes('sign_in_failed') ||
      loweredMessage.includes('sha-1') ||
      loweredMessage.includes('sha1');

    if (looksLikeAndroidOAuthMismatch) {
      return new AuthError('configuration', GOOGLE_ANDROID_SIGNING_SETUP_MESSAGE);
    }
    return new AuthError('unknown', fallbackMessage);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const authResult = await signInWithEmailAndPassword(
        this.auth,
        email.trim().toLowerCase(),
        password,
      );
      if (!authResult.user) {
        throw new Error('Failed to login');
      }
      const token = await authResult.user.getIdToken();
      const user = this.mapFirebaseUser(authResult.user, new Date().toISOString());
      return { user, token };
    } catch (error) {
      throw this.toAuthError(error, 'Failed to login');
    }
  }

  async signup(email: string, password: string): Promise<AuthResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const signInMethods = await fetchSignInMethodsForEmail(
        this.auth,
        normalizedEmail,
      );
      if (signInMethods.length > 0) {
        throw new AuthError(
          'invalid_credentials',
          'Email is already registered. Please login instead.',
        );
      }
      const authResult = await createUserWithEmailAndPassword(
        this.auth,
        normalizedEmail,
        password,
      );
      if (!authResult.user) {
        throw new Error('Failed to signup');
      }
      const token = await authResult.user.getIdToken();
      const user = this.mapFirebaseUser(authResult.user, new Date().toISOString());
      return { user, token };
    } catch (error) {
      throw this.toAuthError(error, 'Failed to signup');
    }
  }

  private configureGoogleSignIn(): void {
    if (this.googleConfigured) {
      return;
    }
    GoogleSignin.configure({
      webClientId: getGoogleWebClientId(),
    });
    this.googleConfigured = true;
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      this.configureGoogleSignIn();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === 'cancelled') {
        throw new AuthError('cancelled', 'Sign-in cancelled.');
      }

      let idToken = signInResult.data.idToken ?? null;
      // Android sometimes omits idToken on the initial account object; refresh via getTokens().
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken ?? null;
      }

      if (!idToken) {
        throw new Error(
          'Google Sign-In did not return an ID token. Confirm GOOGLE_WEB_CLIENT_ID matches the Web client in Firebase and that SHA-1 fingerprints are registered for app.pawfect.',
        );
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const authResult = await signInWithCredential(this.auth, googleCredential);
      if (!authResult.user) {
        throw new Error('Google Sign-In failed.');
      }

      const token = await authResult.user.getIdToken();
      const user = this.mapFirebaseUser(authResult.user, new Date().toISOString());
      return { user, token };
    } catch (error) {
      throw this.toAuthError(error, 'Google Sign-In failed.');
    }
  }

  async requestOtp(phoneE164: string): Promise<{ verificationId: string }> {
    try {
      const confirmation = await signInWithPhoneNumber(this.auth, phoneE164);
      if (!confirmation.verificationId) {
        throw new Error('Failed to request OTP');
      }
      return { verificationId: confirmation.verificationId };
    } catch (error) {
      throw this.toAuthError(error, 'Failed to request OTP');
    }
  }

  async verifyOtp(
    verificationId: string,
    otpCode: string,
  ): Promise<AuthResponse> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const authResult = await signInWithCredential(this.auth, credential);
      const firebaseUser = authResult.user;
      if (!firebaseUser) {
        throw new Error('Failed to verify OTP');
      }

      const token = await firebaseUser.getIdToken();
      const user = this.mapFirebaseUser(
        firebaseUser,
        authResult.additionalUserInfo?.profile ? undefined : new Date().toISOString(),
      );
      return { user, token };
    } catch (error) {
      throw this.toAuthError(error, 'Failed to verify OTP');
    }
  }

  async resendOtp(phoneE164: string): Promise<{ verificationId: string }> {
    try {
      const confirmation = await signInWithPhoneNumber(this.auth, phoneE164);
      if (!confirmation.verificationId) {
        throw new Error('Failed to resend OTP');
      }
      return { verificationId: confirmation.verificationId };
    } catch (error) {
      throw this.toAuthError(error, 'Failed to resend OTP');
    }
  }

  async getCurrentSession(): Promise<AuthResponse | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      return null;
    }
    const token = await currentUser.getIdToken(true);
    return {
      user: this.mapFirebaseUser(currentUser),
      token,
    };
  }

  async getCurrentUser(token: string): Promise<User | null> {
    const response = await apiClient.request<User>({
      path: '/auth/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data ?? null;
  }

  async logout(token: string | null): Promise<void> {
    try {
      if (token) {
        await apiClient.request<void>({
          path: '/auth/logout',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Backend may be a stub; still clear native sessions below.
    }
    try {
      this.configureGoogleSignIn();
      await GoogleSignin.signOut();
    } catch {
      // Google session may be absent or Play Services unavailable.
    } finally {
      await signOut(this.auth);
    }
  }

  watchAuthChanges(
    onChange: (session: AuthResponse | null) => void,
  ): () => void {
    return onAuthStateChanged(this.auth, async firebaseUser => {
      if (!firebaseUser) {
        onChange(null);
        return;
      }
      try {
        const token = await firebaseUser.getIdToken(true);
        onChange({
          user: this.mapFirebaseUser(firebaseUser),
          token,
        });
      } catch {
        onChange(null);
      }
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await firebaseSendPasswordResetEmail(this.auth, email.trim().toLowerCase());
    } catch (error) {
      throw this.toAuthError(error, 'Could not send password reset email.');
    }
  }
}

export const createAuthRemoteDataSource = (): AuthRemoteDataSource =>
  new AuthRemoteDataSourceImpl();

