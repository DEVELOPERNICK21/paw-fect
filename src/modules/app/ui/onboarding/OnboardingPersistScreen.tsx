import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../../shared/components/AppText';
import { Button } from '../../../../shared/components/Button';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { useAuthStore } from '../../../auth/store/authStore';
import { usePetStore } from '../../../pets/store/petStore';
import { useOnboardingDraftStore } from '../../store/onboardingDraftStore';

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
    message: {
      marginTop: spacing.lg,
      textAlign: 'center',
      color: colors.text.heading,
    },
    errorMessage: {
      marginTop: spacing.md,
      textAlign: 'center',
      color: colors.danger,
    },
    retryWrap: {
      marginTop: spacing.xl,
      width: '100%',
    },
  });

export const OnboardingPersistScreen: React.FC = () => {
  const { colors, spacing, textStyles, isDarkMode } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing }),
    [colors, spacing],
  );

  const userId = useAuthStore(state => state.user?.id);
  const nickname = useOnboardingDraftStore(
    state => state.draft.petDraft?.nickname.trim() || 'your pet',
  );
  const persistFirstWin = useOnboardingDraftStore(state => state.persistFirstWin);
  const loadPets = usePetStore(state => state.loadPets);

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

    const result = await persistFirstWin(userId);
    if (result.ok) {
      void loadPets().catch(() => {});
      return;
    }

    setUiState('error');
    setErrorMessage(result.errorMessage);
  }, [userId, persistFirstWin, loadPets]);

  useEffect(() => {
    void runPersist();
  }, [runPersist]);

  const savingLabel = `Saving ${nickname}'s reminder…`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundAlt}
      />
      <View style={styles.container}>
        {uiState === 'loading' ? (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText style={[textStyles.title, styles.message]}>
              {savingLabel}
            </AppText>
          </>
        ) : null}

        {uiState === 'error' ? (
          <>
            <AppText style={[textStyles.title, styles.message]}>
              {savingLabel}
            </AppText>
            {errorMessage ? (
              <AppText style={[textStyles.body, styles.errorMessage]}>
                {errorMessage}
              </AppText>
            ) : null}
            <View style={styles.retryWrap}>
              <Button title="Retry" onPress={() => void runPersist()} />
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingPersistScreen;
