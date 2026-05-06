import { Platform } from 'react-native';

import { RELEASE_BACKEND_BASE_URL } from './releaseBackend';

const stripTrailingSlashes = (url: string): string => url.replace(/\/+$/, '');

/**
 * Base URL for the Next.js backend (bootstrap, subscription create, etc.).
 * In dev, Android emulator uses 10.0.2.2 to reach the host machine.
 * In release, set `RELEASE_BACKEND_BASE_URL` in `releaseBackend.ts`.
 */
export const APP_BACKEND_BASE_URL: string = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : stripTrailingSlashes(RELEASE_BACKEND_BASE_URL);
