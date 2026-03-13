import type { User } from '../../domain/models/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import {
  createAuthRemoteDataSource,
} from '../datasources/AuthRemoteDataSource';
import type { AuthLocalDataSource } from '../datasources/AuthLocalDataSource';
import {
  createAuthLocalDataSource,
} from '../datasources/AuthLocalDataSource';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly remote: AuthRemoteDataSource,
    private readonly local: AuthLocalDataSource,
  ) {}

  async login(email: string, password: string): Promise<User> {
    const { user, token } = await this.remote.login(email, password);
    await this.local.setToken(token);
    await this.local.setUser(user);
    return user;
  }

  async signup(email: string, password: string): Promise<User> {
    const { user, token } = await this.remote.signup(email, password);
    await this.local.setToken(token);
    await this.local.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    const token = await this.local.getToken();
    if (token) {
      await this.remote.logout(token);
    }

    await this.local.clearToken();
    await this.local.clearUser();
  }

  async getCurrentUser(): Promise<User | null> {
    const localUser = await this.local.getUser();
    if (localUser) {
      return localUser;
    }

    const token = await this.local.getToken();
    if (!token) {
      return null;
    }

    const remoteUser = await this.remote.getCurrentUser(token);
    if (remoteUser) {
      await this.local.setUser(remoteUser);
    }

    return remoteUser;
  }
}

export const createAuthRepository = (): AuthRepository => {
  const remote = createAuthRemoteDataSource();
  const local = createAuthLocalDataSource();
  return new AuthRepositoryImpl(remote, local);
};

