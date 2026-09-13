declare module 'react-native-config' {
  export interface NativeConfig {
    POSTHOG_PROJECT_TOKEN?: string;
    POSTHOG_HOST?: string;
    REVENUECAT_GOOGLE_API_KEY?: string;
    REVENUECAT_APPLE_API_KEY?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
