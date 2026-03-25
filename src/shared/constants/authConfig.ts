// Paste the Web client ID from Firebase console -> Authentication -> Sign-in method -> Google.
// Example: 1234567890-abc123def456.apps.googleusercontent.com
export const GOOGLE_WEB_CLIENT_ID =
  '119015458250-cl8ka9kndm1e8sub3jb62taei8qaunml.apps.googleusercontent.com';

export const getGoogleWebClientId = (): string => {
  const value = GOOGLE_WEB_CLIENT_ID.trim();
  if (!value || value === 'YOUR_WEB_CLIENT_ID') {
    throw new Error(
      'Google Sign-In is not configured. Set GOOGLE_WEB_CLIENT_ID in authConfig.ts.',
    );
  }
  return value;
};
