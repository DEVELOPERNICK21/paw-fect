import { create } from 'zustand';
import type { User } from '../domain/models/User';
import { createAuthRepository } from '../data/repositories/AuthRepositoryImpl';
import { LoginUser } from '../domain/usecases/LoginUser';
import { SignupUser } from '../domain/usecases/SignupUser';
import { LogoutUser } from '../domain/usecases/LogoutUser';
import { GetCurrentUser } from '../domain/usecases/GetCurrentUser';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
}

const repository = createAuthRepository();
const loginUseCase = new LoginUser(repository);
const signupUseCase = new SignupUser(repository);
const logoutUseCase = new LogoutUser(repository);
const getCurrentUserUseCase = new GetCurrentUser(repository);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const user = await loginUseCase.execute(email, password);
      set({ user, isAuthenticated: true, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[authStore] login error', error);
      set({ loading: false });
    }
  },

  signup: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const user = await signupUseCase.execute(email, password);
      set({ user, isAuthenticated: true, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[authStore] signup error', error);
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await logoutUseCase.execute();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[authStore] logout error', error);
      set({ loading: false });
    }
  },

  loadCurrentUser: async () => {
    set({ loading: true });
    try {
      const user = await getCurrentUserUseCase.execute();
      set({
        user,
        isAuthenticated: Boolean(user),
        loading: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[authStore] loadCurrentUser error', error);
      set({ loading: false });
    }
  },
}));

