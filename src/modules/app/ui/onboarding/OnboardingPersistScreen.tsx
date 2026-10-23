import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  companionLines,
  MascotErrorState,
  MascotLoader,
} from '../../../../shared/components/Companion';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';
import {
  refreshPostPersistDataFromStores,
} from './refreshPostPersistData';

type PersistUiState = 'loading' | 'error';

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
};

const createStyles = ({ colors, spacing }: ThemeParams) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
  });

export const OnboardingPersistScreen: React.FC = () => {
  const { colors, spacing, isDarkMode } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing }),
    [colors, spacing],
  );

  const userId = useAuthStore(state => state.user?.id);
  const nickname = useOnboardingDraftStore(
    state => state.draft.petDraft?.nickname.trim() ?? '',
  );
  const persistFirstWin = useOnboardingDraftStore(state => state.persistFirstWin);

  const [uiState, setUiState] = useState<PersistUiState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runPersist = useCallback(async () => {
    if (!userId) {
      setUiState('error');
      setErrorMessage('Sign in to save your reminder.');
      return;
    }

    setUiState('loading');
    setErrorMessage(null);

    try {
      const result = await persistFirstWin(userId);
      if (result.ok) {
        await refreshPostPersistDataFromStores().catch(() => {});
        return;
      }

      setUiState('error');
      setErrorMessage(result.errorMessage);
    } catch {
      setUiState('error');
      setErrorMessage('Could not save your reminder. Please try again.');
    }
  }, [userId, persistFirstWin]);

  useEffect(() => {
    void runPersist();
  }, [runPersist]);

  const savingLines = useMemo(
    () => companionLines({ scene: 'loading', kind: 'savingFirstWin', petName: nickname }),
    [nickname],
  );
  const errorLines = useMemo(
    () => companionLines({ scene: 'error', kind: 'savingFirstWin', petName: nickname }),
    [nickname],
  );
  const handleRetry = useCallback(() => {
    void runPersist();
  }, [runPersist]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />
      <View style={styles.container}>
        {uiState === 'loading' ? (
          <MascotLoader lines={savingLines} testID="onboarding-persist-loader" />
        ) : null}

        {uiState === 'error' ? (
          <MascotErrorState
            title={errorLines[0]}
            lines={errorMessage ? [errorMessage] : errorLines.slice(1)}
            onRetry={handleRetry}
            testID="onboarding-persist-error"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingPersistScreen;
