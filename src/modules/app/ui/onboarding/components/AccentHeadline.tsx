import React, { useMemo } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '../../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../../shared/theme/typography';

type Segment =
  | { type: 'text'; value: string }
  | { type: 'accent'; value: string };

type Props = {
  /** Plain segments and accent segments in display order. */
  segments: Segment[];
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

type ThemeParams = {
  colors: ReturnType<typeof useTheme>['colors'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
};

const createStyles = ({ colors, fontSizes }: ThemeParams) =>
  StyleSheet.create({
    base: {
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      color: colors.text.heading,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    accent: {
      color: colors.accent,
    },
  });

export const AccentHeadline: React.FC<Props> = ({
  segments,
  style,
  accessibilityLabel,
}) => {
  const { colors, fontFamilies, fontSizes } = useTheme();
  const styles = useMemo(
    () => createStyles({ colors, fontSizes }),
    [colors, fontSizes],
  );

  const label =
    accessibilityLabel ??
    segments.map(segment => segment.value).join('');

  return (
    <Text
      style={[styles.base, { fontFamily: fontFamilies.extrabold }, style]}
      accessibilityRole="header"
      accessibilityLabel={label}
    >
      {segments.map((segment, index) =>
        segment.type === 'accent' ? (
          <Text
            key={`a-${index}`}
            style={[styles.accent, { fontFamily: fontFamilies.extrabold }]}
          >
            {segment.value}
          </Text>
        ) : (
          <Text key={`t-${index}`}>{segment.value}</Text>
        ),
      )}
    </Text>
  );
};
