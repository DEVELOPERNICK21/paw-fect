import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Mascot, type MascotMood, type MascotReactionRequest } from '../Mascot';

export interface MascotStatePanelProps {
  mood: MascotMood;
  /** What the companion says. A tap on it or the text brings up the next line. */
  lines: string[];
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Played once each time the panel appears. */
  reactionOnShow?: MascotReactionRequest['reaction'];
  size?: number;
  /** `false` inside lists or next to another animated mascot. */
  animated?: boolean;
  testID?: string;
}

let showCount = 0;

/** The companion filling an empty or failed area of a screen, with one clear next step. */
export const MascotStatePanel: React.FC<MascotStatePanelProps> = ({
  mood,
  lines,
  title,
  actionLabel,
  onAction,
  reactionOnShow,
  size = 112,
  animated,
  testID,
}) => {
  const { colors, spacing, textStyles } = useTheme();
  const [index, setIndex] = useState(0);
  const [reactionRequest] = useState<MascotReactionRequest | null>(() =>
    reactionOnShow ? { reaction: reactionOnShow, id: `state-panel-${++showCount}` } : null,
  );

  const primary = lines[0] ?? '';
  useEffect(() => {
    setIndex(0);
  }, [primary]);

  const nextLine = useCallback(() => {
    if (lines.length > 1) {
      setIndex(i => (i + 1) % lines.length);
    }
  }, [lines.length]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xl,
          gap: spacing.md,
        },
        title: { ...textStyles.title, color: colors.text.heading, textAlign: 'center' },
        line: { ...textStyles.body, color: colors.text.body, textAlign: 'center' },
        action: { alignSelf: 'stretch', marginTop: spacing.sm },
      }),
    [colors, spacing, textStyles],
  );

  const line = lines[index % Math.max(lines.length, 1)] ?? '';

  return (
    <View style={styles.root} testID={testID}>
      <Mascot
        mood={mood}
        size={size}
        interactive
        onPress={nextLine}
        animated={animated}
        reactionRequest={reactionRequest}
      />
      {title ? (
        <AppText style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <Pressable onPress={nextLine} accessibilityRole="text" accessibilityLabel={line}>
        <AppText style={styles.line}>{line}</AppText>
      </Pressable>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
};

export type MascotEmptyStateProps = Omit<MascotStatePanelProps, 'mood' | 'reactionOnShow'> & {
  mood?: MascotMood;
};

/** Nothing here yet: a friendly companion and the action that fills the space. */
export const MascotEmptyState: React.FC<MascotEmptyStateProps> = ({ mood = 'happy', ...rest }) => (
  <MascotStatePanel mood={mood} {...rest} />
);

export type MascotErrorStateProps = Omit<
  MascotStatePanelProps,
  'mood' | 'reactionOnShow' | 'actionLabel' | 'onAction'
> & {
  onRetry: () => void;
  retryLabel?: string;
};

/** Something failed: calm and attentive, never sad or alarmed, with a way to try again. */
export const MascotErrorState: React.FC<MascotErrorStateProps> = ({
  onRetry,
  retryLabel = 'Try again',
  ...rest
}) => (
  <MascotStatePanel
    mood="nudge"
    reactionOnShow="attention"
    actionLabel={retryLabel}
    onAction={onRetry}
    {...rest}
  />
);
