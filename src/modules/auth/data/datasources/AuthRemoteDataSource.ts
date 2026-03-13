import type { User } from '../../domain/models/User';
import { apiClient } from '../../../../infrastructure/api/apiClient';

interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthRemoteDataSource {
  login(email: string, password: string): Promise<AuthResponse>;
  signup(email: string, password: string): Promise<AuthResponse>;
  getCurrentUser(token: string): Promise<User | null>;
  logout(token: string): Promise<void>;
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse, { email: string; password: string }>({
      path: '/auth/login',
      method: 'POST',
      body: { email, password },
    });

    if (!response.data) {
      throw new Error('Failed to login');
    }

    return response.data;
  }

  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.request<AuthResponse, { email: string; password: string }>({
      path: '/auth/signup',
      method: 'POST',
      body: { email, password },
    });

    if (!response.data) {
      throw new Error('Failed to signup');
    }

    return response.data;
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

  async logout(token: string): Promise<void> {
    await apiClient.request<void>({
      path: '/auth/logout',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const createAuthRemoteDataSource = (): AuthRemoteDataSource =>
  new AuthRemoteDataSourceImpl();

