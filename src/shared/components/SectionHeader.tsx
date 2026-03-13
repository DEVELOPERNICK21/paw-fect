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

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  containerStyle,
  titleStyle,
  subtitleStyle,
  rightElement,
}) => {
  const { colors, space, textStyles } = useTheme();

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        { marginBottom: space('sm') },
        containerStyle,
      ])}
    >
      <View style={styles.left}>
        <Text
          style={StyleSheet.flatten([
            textStyles.subtitle,
            { color: colors.text.primary },
            titleStyle,
          ])}
        >
          {title}
        </Text>
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
      {rightElement ? <View>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
});

// Example:
// <SectionHeader title="Today's Care" subtitle="For Luna" />

