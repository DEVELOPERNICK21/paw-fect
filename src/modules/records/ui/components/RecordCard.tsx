import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HealthRecord } from '../../domain/models/HealthRecord';
import { Card } from '../../../../shared/components/Card';
import { Chip } from '../../../../shared/components/Chip';
import { useTheme } from '../../../../shared/hooks/useTheme';
import { AttachmentPreview } from './AttachmentPreview';

export interface RecordCardProps {
  record: HealthRecord;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const { colors, textStyles, space } = useTheme();

  return (
    <Card
      title={record.title}
      subtitle={record.notes}
      actions={
        <Chip
          label={record.category}
          style={{ marginLeft: space('sm') }}
        />
      }
    >
      <View style={styles.metaRow}>
        <Text
          style={[
            textStyles.caption,
            { color: colors.text.secondary },
          ]}
        >
          {record.date}
        </Text>
      </View>
      {record.attachments.length > 0 ? (
        <AttachmentPreview attachments={record.attachments} />
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

