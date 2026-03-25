import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing as spacingTokens } from '../theme/spacing';

export interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  containerStyle,
  contentStyle,
  titleStyle,
  subtitleStyle,
}) => {
  const { colors, radius, space, textStyles, shadows } = useTheme();

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space('md'),
          borderColor: colors.border,
        },
        shadows.sm,
        containerStyle,
      ])}
    >
      {(title || subtitle || icon || actions) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon}
            <View style={styles.headerText}>
              {title ? (
                <Text
                  style={StyleSheet.flatten([
                    textStyles.subtitle,
                    { color: colors.text.primary },
                    titleStyle,
                  ])}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={StyleSheet.flatten([
                    textStyles.caption,
                    { color: colors.text.secondary },
                    subtitleStyle,
                  ])}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      )}
      {children ? (
        <View style={StyleSheet.flatten([styles.content, contentStyle])}>
          {children}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingTokens.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: spacingTokens.sm,
  },
  actions: {
    marginLeft: spacingTokens.sm,
  },
  content: {
    marginTop: spacingTokens.xs,
  },
});

// Example:
// <Card title="Next vet visit" subtitle="Tomorrow at 10:00">
//   <Text>Bring vaccination book.</Text>
// </Card>

