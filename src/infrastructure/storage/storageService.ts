import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageService {
  getItem<T = unknown>(key: string): Promise<T | null>;
  setItem<T = unknown>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class AsyncStorageService implements StorageService {
  async getItem<T = unknown>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value == null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value ?? null);
    await AsyncStorage.setItem(key, serialized);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}

export const storageService: StorageService = new AsyncStorageService();

