import type { User } from '../models/User';

export interface AuthRepository {
  login(email: string, password: string): Promise<User>;
  signup(email: string, password: string): Promise<User>;
  loginWithGoogle(): Promise<User>;
  loginWithApple(): Promise<User>;
  requestOtp(phoneE164: string): Promise<string>;
  verifyOtp(verificationId: string, otpCode: string): Promise<User>;
  resendOtp(phoneE164: string): Promise<string>;
  logout(): Promise<void>;
  /** Permanently deletes account data + Firebase Auth user, then clears local session. */
  deleteAccount(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  sendPasswordResetEmail(email: string): Promise<void>;
  processPasswordResetQueue(): Promise<void>;
  updateUserProfile(input: {
    displayName: string;
    phoneNumber: string | null;
  }): Promise<User>;
  subscribeSession(onChange: (user: User | null) => void): () => void;
  refreshProfileFromRemoteSession(): Promise<User | null>;
}

