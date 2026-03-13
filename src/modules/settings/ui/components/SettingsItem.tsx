import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface SettingsItemProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  description,
  children,
  containerStyle,
  titleStyle,
  descriptionStyle,
}) => {
  const { colors, space, textStyles, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: space('sm'),
          paddingHorizontal: space('md'),
          borderBottomColor: colors.border,
        },
        containerStyle,
      ]}
    >
      <View style={styles.textContainer}>
        <Text
          style={[
            textStyles.body,
            { color: colors.text.primary },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              textStyles.caption,
              { color: colors.text.secondary, marginTop: space('xs') },
              descriptionStyle,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {children ? (
        <View
          style={[
            styles.control,
            {
              borderRadius: radius.pill,
            },
          ]}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textContainer: {
    flex: 1,
  },
  control: {
    marginLeft: 12,
  },
});

