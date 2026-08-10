import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';
import { buildProcessingLines } from '../../../domain/onboarding/buildProcessingLines';
import type { PetDraft } from '../../../domain/onboarding/OnboardingDraft';
import { OnboardingBlobBackdrop } from '../components/OnboardingBlobBackdrop';

const PROCESSING_DURATION_MS = 2000;
const LINE_ROTATE_MS = 650;

type Props = {
  nickname: string;
  species?: PetDraft['species'] | null;
  onDone: () => void;
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, spacing, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    root: {
      minHeight: 320,
      overflow: 'hidden',
    },
    container: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing['4xl'],
      alignItems: 'center',
      zIndex: 1,
    },
    pulseWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    lineSlot: {
      marginTop: spacing.xl,
      minHeight: lineHeights.lg * 2,
      justifyContent: 'center',
      width: '100%',
    },
    title: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      color: colors.text.heading,
      textAlign: 'center',
    },
  });

export const ProcessingStep: React.FC<Props> = ({
  nickname,
  species,
  onDone,
}) => {
  const { colors, fontFamilies, fontSizes, spacing } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, spacing, fontSizes }),
    [colors, spacing, fontSizes],
  );

  const lines = useMemo(
    () => buildProcessingLines(nickname, species),
    [nickname, species],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(onDone, PROCESSING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setLineIndex(prev => (prev + 1) % lines.length);
    }, LINE_ROTATE_MS);
    return () => clearInterval(rotate);
  }, [lines.length]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.root}>
      <OnboardingBlobBackdrop />
      <View style={styles.container}>
        <Animated.View
          style={[styles.pulseWrap, { transform: [{ scale: pulse }] }]}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </Animated.View>
        <View style={styles.lineSlot}>
          <Text style={[styles.title, { fontFamily: fontFamilies.bold }]}>
            {lines[lineIndex]}
          </Text>
        </View>
      </View>
    </View>
  );
};
