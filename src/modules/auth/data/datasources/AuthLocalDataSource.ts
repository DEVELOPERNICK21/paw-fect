import type { User } from '../../domain/models/User';
import { storageService } from '../../../../infrastructure/storage/storageService';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export interface AuthLocalDataSource {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  getUser(): Promise<User | null>;
  setUser(user: User): Promise<void>;
  clearUser(): Promise<void>;
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  async getToken(): Promise<string | null> {
    const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY);
    return token ?? null;
  }

  async setToken(token: string): Promise<void> {
    await storageService.setItem(AUTH_TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    await storageService.removeItem(AUTH_TOKEN_KEY);
  }

  async getUser(): Promise<User | null> {
    const user = await storageService.getItem<User | null>(AUTH_USER_KEY);
    return user ?? null;
  }

  async setUser(user: User): Promise<void> {
    await storageService.setItem(AUTH_USER_KEY, user);
  }

  async clearUser(): Promise<void> {
    await storageService.removeItem(AUTH_USER_KEY);
  }
}

export const createAuthLocalDataSource = (): AuthLocalDataSource =>
  new AuthLocalDataSourceImpl();

