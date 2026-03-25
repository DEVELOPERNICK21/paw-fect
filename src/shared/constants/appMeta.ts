export const APP_VERSION_LABEL = `Version ${
  (require('../../../package.json') as { version?: string }).version ?? '1.0.0'
}`;
