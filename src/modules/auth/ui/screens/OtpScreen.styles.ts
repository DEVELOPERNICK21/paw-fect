import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import type { Theme } from '../../../../shared/hooks/useTheme';
import { lineHeights } from '../../../../shared/theme/typography';

/**
 * OTP screen styles derived from design tokens (see `.cursor/system/design-system.md`).
 */
export const createOtpScreenStyles = ({ colors, spacing, radius, fontSizes, shadows }: Theme) => {
  const horizGutter = spacing.lg + spacing.xs;
  const decorCircle = spacing['5xl'] * 4; // 224 ≈ original 220
  const primaryButtonShadow: ViewStyle = {
    ...shadows.lg,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: Platform.OS === 'android' ? 8 : 0,
  };

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundAlt,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: horizGutter,
      paddingTop: spacing['5xl'] + spacing['4xl'],
      paddingBottom: spacing['3xl'],
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    backgroundDecorContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    decorTopRight: {
      position: 'absolute',
      top: -spacing['6xl'],
      right: -spacing['6xl'] + spacing.sm,
      width: decorCircle,
      height: decorCircle,
      borderRadius: decorCircle / 2,
      backgroundColor: colors.brandTint12,
    },
    decorBottomLeft: {
      position: 'absolute',
      bottom: -118,
      left: -86,
      width: decorCircle,
      height: decorCircle,
      borderRadius: decorCircle / 2,
      backgroundColor: colors.brandTint10,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
      paddingHorizontal: spacing.xl,
      justifyContent: 'flex-end',
    },
    titleBlock: {
      width: '100%',
      alignItems: 'center',
      marginBottom: spacing['4xl'] - spacing.sm,
    },
    title: {
      marginTop: spacing.md + spacing.sm,
      fontSize: fontSizes['2xl'],
      lineHeight: lineHeights['2xl'],
      letterSpacing: -0.5,
      color: colors.text.heading,
      textAlign: 'center',
    } as TextStyle,
    subtitle: {
      marginTop: spacing.sm + spacing.xs,
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.text.secondary,
      textAlign: 'center',
    } as TextStyle,
    subtitleBold: {
      color: colors.text.heading,
    },
    form: {
      width: '100%',
    },
    actions: {
      width: '100%',
      marginTop: spacing['4xl'] + spacing.sm,
      alignItems: 'center',
    },
    primaryButton: {
      width: '100%',
      height: spacing['6xl'],
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      ...primaryButtonShadow,
    },
    primaryButtonDisabled: {
      opacity: 0.72,
    },
    primaryButtonText: {
      fontSize: fontSizes.lg,
      lineHeight: lineHeights.lg,
      color: colors.text.inverse,
      letterSpacing: 0,
    } as TextStyle,
    resendBlock: {
      marginTop: spacing.xl + spacing.sm,
      alignItems: 'center',
    },
    resendCaption: {
      fontSize: fontSizes.lead,
      lineHeight: lineHeights.sm,
      color: colors.text.secondary,
    } as TextStyle,
    resendButton: {
      marginTop: spacing.sm + spacing.xxs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: spacing.lg + spacing.md,
    },
    resendClock: {
      marginRight: spacing.sm,
    },
    resendLinkText: {
      fontSize: fontSizes.base,
      lineHeight: lineHeights.base,
      color: colors.primary,
    } as TextStyle,
    errorText: {
      marginTop: spacing.md,
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      textAlign: 'center',
      color: colors.danger,
    } as TextStyle,
    secureNote: {
      marginTop: spacing['5xl'] - spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.6,
    },
    secureNoteIcon: {
      marginRight: spacing.sm,
      fontSize: fontSizes.md,
      color: colors.text.secondary,
    } as TextStyle,
    secureNoteText: {
      fontSize: fontSizes.xs,
      lineHeight: lineHeights.xs,
      color: colors.text.secondary,
      letterSpacing: 1.2,
    } as TextStyle,
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
  });
};

export type OtpScreenStyles = ReturnType<typeof createOtpScreenStyles>;
