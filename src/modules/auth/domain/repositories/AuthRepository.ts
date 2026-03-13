import type { User } from '../models/User';

export interface AuthRepository {
  login(email: string, password: string): Promise<User>;
  signup(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

