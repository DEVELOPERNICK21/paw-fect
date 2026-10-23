import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../AppText';
import { Mascot, type MascotMood } from '../Mascot';

export interface MascotLoaderProps {
  /** Rotated while waiting. The first line shows first. */
  lines: string[];
  mood?: MascotMood;
  size?: number;
  rotateMs?: number;
  testID?: string;
}

const DEFAULT_ROTATE_MS = 1600;

/**
 * Full-screen or section waits: the companion works on it ("thinking") and says what it is
 * doing, instead of a bare spinner.
 */
export const MascotLoader: React.FC<MascotLoaderProps> = ({
  lines,
  mood = 'thinking',
  size = 120,
  rotateMs = DEFAULT_ROTATE_MS,
  testID,
}) => {
  const { colors, spacing, textStyles } = useTheme();
  const [index, setIndex] = useState(0);
  const lineCount = lines.length;
  const linesKey = lines.join('\n');

  useEffect(() => {
    setIndex(0);
    if (lineCount < 2) {
      return undefined;
    }
    const timer = setInterval(() => setIndex(i => (i + 1) % lineCount), rotateMs);
    return () => clearInterval(timer);
  }, [linesKey, lineCount, rotateMs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
        line: {
          ...textStyles.subtitle,
          color: colors.text.heading,
          textAlign: 'center',
        },
      }),
    [colors, spacing, textStyles],
  );

  const line = lines[index % Math.max(lines.length, 1)] ?? '';

  return (
    <View
      style={styles.root}
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={line}
      accessibilityLiveRegion="polite"
    >
      <Mascot mood={mood} size={size} />
      <AppText style={styles.line}>{line}</AppText>
    </View>
  );
};
