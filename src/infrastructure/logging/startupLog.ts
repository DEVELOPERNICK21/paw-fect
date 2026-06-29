import { getCrashlytics, log as crashlyticsLog } from '@react-native-firebase/crashlytics';

const STARTUP_SCOPE = '[Pawfect:startup]';
const appStartedAtMs = Date.now();

function formatElapsedMs(): string {
  return `+${Date.now() - appStartedAtMs}ms`;
}

function writeCrashlyticsBreadcrumb(message: string): void {
  try {
    crashlyticsLog(getCrashlytics(), message);
  } catch {
    /* Crashlytics must never tear down the RN shell */
  }
}

/** Dev console + Crashlytics breadcrumb for cold-start diagnosis. */
export function startupLog(phase: string, detail?: string): void {
  const suffix = detail != null && detail.length > 0 ? ` — ${detail}` : '';
  const line = `${STARTUP_SCOPE} ${formatElapsedMs()} ${phase}${suffix}`;
  writeCrashlyticsBreadcrumb(line);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export function startupError(phase: string, error: unknown): void {
  const message =
    error instanceof Error ? error.message : String(error ?? 'unknown error');
  const line = `${STARTUP_SCOPE} ${formatElapsedMs()} ${phase} failed: ${message}`;
  writeCrashlyticsBreadcrumb(line);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(line, error);
  }
}
