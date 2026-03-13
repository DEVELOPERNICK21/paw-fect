import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../shared/hooks/useTheme';

export interface AttachmentPreviewProps {
  attachments: string[];
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
}) => {
  const { colors, radius, space, textStyles } = useTheme();

  if (attachments.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: space('sm') }}
    >
      {attachments.map((attachment, index) => (
        <View
          key={`${attachment}-${index.toString()}`}
          style={[
            styles.item,
            {
              borderRadius: radius.sm,
              paddingHorizontal: space('sm'),
              paddingVertical: space('xs'),
              backgroundColor: colors.background,
              borderColor: colors.border,
              marginRight: space('xs'),
            },
          ]}
        >
          <Text
            style={[
              textStyles.caption,
              { color: colors.text.secondary },
            ]}
            numberOfLines={1}
          >
            {attachment}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  item: {
    borderWidth: 1,
    maxWidth: 140,
  },
});

