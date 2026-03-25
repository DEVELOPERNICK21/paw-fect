export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  createdAt: string;
  lastLoginAt: string;
  onboardingCompleted: boolean;
}
